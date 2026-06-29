import React, { useState } from "react";
import { ArrowLeft, Loader2, BookOpen, Search, User, Calendar, ExternalLink, Library, Bookmark } from "lucide-react";

interface Book {
  title: string;
  author: string;
  publishYear: string | number;
  publisher: string;
  isbn?: string | null;
  coverUrl?: string | null;
  openLibraryUrl?: string;
}

interface CropLiteratureLibraryProps {
  onNavigate: (page: string) => void;
}

export default function CropLiteratureLibrary({ onNavigate }: CropLiteratureLibraryProps) {
  const [cropName, setCropName] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const response = await fetch("/api/crop-literature-handbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropName })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to search crop literature");
      }

      const json = await response.json();
      setBooks(json.books || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between lg:pr-8 border-b border-gray-150 pb-5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Library className="w-7 h-7 text-emerald-600" />
              Agronomic Literature Library
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Search Open Library for peer-reviewed handbooks, botanical monographs, and extension books.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="w-full md:w-96 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="Enter crop (e.g. Olive, Corn, Cotton)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>

      {!hasSearched && !loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <BookOpen className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Explore Literature Catalogs
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Access thousands of academic books, scientific manuals, and cropping guidebooks globally.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Scanning catalogs on Open Library API...
          </p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          Error: {error}
        </div>
      )}

      {hasSearched && !loading && books.length === 0 && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <Bookmark className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            No Literature Found
          </h3>
          <p className="text-sm text-slate-500 max-w-xs">
            We couldn't locate specific monographs for "{cropName}". Try general terms like "Cereal", "Fruit", or "Soil".
          </p>
        </div>
      )}

      {hasSearched && !loading && books.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book, index) => (
            <div key={index} className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between h-[280px]">
              <div>
                <div className="flex gap-4 items-start">
                  {book.coverUrl ? (
                    <img 
                      src={book.coverUrl} 
                      alt={book.title} 
                      referrerPolicy="no-referrer"
                      className="w-14 h-20 object-cover rounded-md bg-slate-100 shadow-sm shrink-0 border border-slate-200" 
                    />
                  ) : (
                    <div className="w-14 h-20 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 border shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 leading-snug line-clamp-2" title={book.title}>
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <User className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{book.author}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>Published: {book.publishYear}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-[11px] text-slate-400 mt-4 leading-relaxed font-mono line-clamp-2">
                  Publisher: {book.publisher}
                  {book.isbn && ` | ISBN: ${book.isbn}`}
                </p>
              </div>

              {book.openLibraryUrl && (
                <div className="border-t border-slate-100 pt-3 mt-auto">
                  <a
                    href={book.openLibraryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline uppercase tracking-wider"
                  >
                    View on Open Library
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
