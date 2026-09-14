const getRetroCropBlocks = (cropType) => {
  const rows = [
    Array(20).fill(null),
    Array(20).fill(null),
    Array(20).fill(null),
  ];

  const type = cropType.toLowerCase();

  if (type.includes("corn")) {
    for (let i = 2; i < 20; i += 4) {
      rows[0][i] = "bg-green-500 border-t-green-400 border-l-green-400 border-b-green-600 border-r-green-600";
      rows[0][i+1] = "bg-yellow-400 border-t-yellow-300 border-l-yellow-300 border-b-yellow-500 border-r-yellow-500";
      rows[1][i] = "bg-green-600 border-t-green-500 border-l-green-500 border-b-green-700 border-r-green-700";
      rows[2][i] = "bg-green-700 border-t-green-600 border-l-green-600 border-b-green-800 border-r-green-800";
    }
  }
  return rows;
}
console.log(getRetroCropBlocks("Corn")[0]);
