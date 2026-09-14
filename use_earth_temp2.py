import re

with open("src/pages/DeepSoilTemperature.tsx", "r") as f:
    content = f.read()

content = content.replace('id: "0-7cm", \n                      height: 5,', 'id: "0-7cm", \n                      height: 3,')
content = content.replace('id: "7-28cm", \n                      height: 5,', 'id: "7-28cm", \n                      height: 4,')
content = content.replace('id: "28-100cm", \n                      height: 5,', 'id: "28-100cm", \n                      height: 5,')
content = content.replace('id: "100-255cm", \n                      height: 5,', 'id: "100-255cm", \n                      height: 6,')

with open("src/pages/DeepSoilTemperature.tsx", "w") as f:
    f.write(content)
print("done")
