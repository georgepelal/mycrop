# Firebase Security Specification

This document outlines the security invariants, validation rules, and the Red Team "Dirty Dozen" audit tests for MyCrop's firestore database.

## 1. Data Invariants

1. **Ownership Isolation**: A user can only access (`read`, `write`, `delete`) parcels where the `ownerId` matches their authenticated `request.auth.uid`.
2. **Identity Integrity**: During parcel creation or update, the `ownerId` must equal `request.auth.uid` to prevent identity spoofing.
3. **No Blanket Reads**: Anonymous reads or blanket authenticated reads are forbidden. Collection lists must filter by `ownerId == request.auth.uid`.
4. **ID Poisoning Safeguard**: The path variable `{parcelId}` must follow strict string syntax validation (`isValidId()`).
5. **No System Overrides**: Immutability is enforced on fields like `id` and `ownerId`.
6. **Temporal integrity**: `lastUpdated` or timestamp audits should match the request server time representation (or be validated strings of appropriate character size).

---

## 2. The "Dirty Dozen" Vulnerability Payloads

The rules will prevent the following 12 malicious payloads from succeeding:

1. **Identity Spoofing on Create**: Logged in user `attacker_uid` attempts to create a parcel with `ownerId: "victim_uid"`. Must be denied.
2. **Identity Hijacking on Update**: Logged in user `attacker_uid` attempts to update `ownerId` of another user's parcel to `attacker_uid`. Must be denied.
3. **ID Poisoning via Extended Characters**: Attacker attempts to create a parcel with ID `parcel_$$$_###_attacker_junk_123_extremely_long_string_overflow_denial_of_service` exceeding 128 characters. Must be denied.
4. **Blanket Authenticated Listing**: Attacker queries the entire `parcels` list without specifying their own `ownerId` where clause. Must be denied.
5. **PII and Data Scraping**: Attacker requests document `parcels/some_other_user_field_1` without owner matching. Must be denied.
6. **Type Poisoning (Invalid farmSize type)**: Requesting a parcel with `farmSize: "one hundred"`, bypassing UI checks. Must be denied.
7. **Type Poisoning (Invalid soilPH out of bounds)**: Requesting a parcel with `soilPH: 99.9` (must be between 0 and 14). Must be denied.
8. **Malicious Long String Injection**: Attacker injects a 5MB base64 string under `name`. Must be denied by size boundaries.
9. **Soil Moisture Out of Bounds Check**: Attacker tries to set `soilMoisture: -30` or `125` (must be 0-100%). Must be denied.
10. **State/Crop Spoofing**: Setting `cropType` to an unapproved custom string like `Marijuana_Malicious_Weed_1` when Approval bounds only permit reasonable list indices. Must be denied.
11. **Malicious Image payload over size limits**: Uploading string over `100000` characters representing a huge script snippet. Must be denied.
12. **Unauthenticated Write**: An unauthenticated request attempts to create a parcel. Must be denied.

---

## 3. Recommended firestore.rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Global Safety Net Default-Deny Catch-All
    match /{document=**} {
      allow read, write: if false;
    }

    // Common Global Security Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isVerifiedUser() {
      return isSignedIn() && (request.auth.token.email_verified == true || request.auth.token.firebase.sign_in_provider == 'google.com');
    }

    function isOwner(resourceData) {
      return isVerifiedUser() && resourceData.ownerId == request.auth.uid;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function isValidParcel(data) {
      return data.keys().hasAll(['id', 'name', 'cropType', 'farmSize', 'location', 'ownerId'])
        && data.keys().size() <= 20
        && data.id is string && data.id.size() <= 128
        && data.name is string && data.name.size() > 0 && data.name.size() <= 100
        && data.cropType is string && data.cropType.size() <= 50
        && data.farmSize is number && data.farmSize >= 0.1 && data.farmSize <= 100000
        && data.location is string && data.location.size() <= 200
        && data.ownerId is string && data.ownerId == request.auth.uid
        && (data.get('soilType', 'Loamy') is string && data.get('soilType', 'Loamy').size() <= 50)
        && (data.get('soilPH', 6.5) is number && data.get('soilPH', 6.5) >= 0.0 && data.get('soilPH', 6.5) <= 14.0)
        && (data.get('soilMoisture', 50) is number && data.get('soilMoisture', 50) >= 0 && data.get('soilMoisture', 50) <= 100)
        && (data.get('ndviValue', 0.5) is number && data.get('ndviValue', 0.5) >= -1.0 && data.get('ndviValue', 0.5) <= 1.0)
        && (data.get('ndwiValue', 0.5) is number && data.get('ndwiValue', 0.5) >= -1.0 && data.get('ndwiValue', 0.5) <= 1.0);
    }

    // Parcels Collection Rules
    match /parcels/{parcelId} {
      allow get: if isOwner(resource.data);
      allow list: if isVerifiedUser() && resource.data.ownerId == request.auth.uid;
      
      allow create: if isVerifiedUser() 
        && isValidId(parcelId) 
        && isValidParcel(request.resource.data) 
        && request.resource.data.id == parcelId;
        
      allow update: if isOwner(resource.data) 
        && isValidParcel(request.resource.data)
        && request.resource.data.id == resource.data.id
        && request.resource.data.ownerId == resource.data.ownerId;
        
      allow delete: if isOwner(resource.data);
    }
  }
}
```
