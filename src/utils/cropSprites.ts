export const getRetroCropBlocks = (cropType: string, columns: number = 20) => {
  const rows = [
    Array(columns).fill(null),
    Array(columns).fill(null),
    Array(columns).fill(null),
  ];

  const type = cropType.toLowerCase();

  if (type.includes("corn")) {
    for (let i = 2; i < columns; i += 4) {
      rows[0][i] = "bg-[#4ade80] border-t-[#86efac] border-l-[#86efac] border-b-[#22c55e] border-r-[#22c55e]";
      rows[0][i+1] = "bg-[#facc15] border-t-[#fef08a] border-l-[#fef08a] border-b-[#eab308] border-r-[#eab308]";
      rows[1][i] = "bg-[#22c55e] border-t-[#4ade80] border-l-[#4ade80] border-b-[#16a34a] border-r-[#16a34a]";
      rows[2][i] = "bg-[#16a34a] border-t-[#22c55e] border-l-[#22c55e] border-b-[#15803d] border-r-[#15803d]";
    }
  } else if (type.includes("wheat") || type.includes("barley") || type.includes("oats") || type.includes("rye") || type.includes("sorghum")) {
    for (let i = 1; i < columns; i += 3) {
      rows[0][i] = "bg-[#fde047] border-t-[#fef08a] border-l-[#fef08a] border-b-[#facc15] border-r-[#facc15]";
      rows[1][i] = "bg-[#facc15] border-t-[#fde047] border-l-[#fde047] border-b-[#eab308] border-r-[#eab308]";
      rows[2][i] = "bg-[#eab308] border-t-[#facc15] border-l-[#facc15] border-b-[#ca8a04] border-r-[#ca8a04]";
    }
  } else if (type.includes("cotton")) {
    for (let i = 2; i < columns; i += 5) {
      rows[0][i] = "bg-white border-t-white border-l-white border-b-slate-200 border-r-slate-200";
      rows[0][i-1] = "bg-white border-t-white border-l-white border-b-slate-200 border-r-slate-200";
      rows[1][i] = "bg-[#10b981] border-t-[#34d399] border-l-[#34d399] border-b-[#059669] border-r-[#059669]";
      rows[2][i] = "bg-[#059669] border-t-[#10b981] border-l-[#10b981] border-b-[#047857] border-r-[#047857]";
    }
  } else if (type.includes("soybean") || type.includes("bean") || type.includes("pea") || type.includes("alfalfa") || type.includes("peanut")) {
    for (let i = 1; i < columns; i += 4) {
      rows[1][i] = "bg-[#4ade80] border-t-[#86efac] border-l-[#86efac] border-b-[#22c55e] border-r-[#22c55e]";
      rows[1][i+1] = "bg-[#4ade80] border-t-[#86efac] border-l-[#86efac] border-b-[#22c55e] border-r-[#22c55e]";
      rows[2][i] = "bg-[#22c55e] border-t-[#4ade80] border-l-[#4ade80] border-b-[#16a34a] border-r-[#16a34a]";
    }
  } else if (type.includes("potato") || type.includes("beet") || type.includes("carrot") || type.includes("onion") || type.includes("garlic")) {
    // Root crops: bushy low top
    for (let i = 2; i < columns; i += 4) {
      rows[2][i] = "bg-[#84cc16] border-t-[#a3e635] border-l-[#a3e635] border-b-[#65a30d] border-r-[#65a30d]";
      rows[2][i+1] = "bg-[#65a30d] border-t-[#84cc16] border-l-[#84cc16] border-b-[#4d7c0f] border-r-[#4d7c0f]";
      rows[1][i] = "bg-[#84cc16] border-t-[#a3e635] border-l-[#a3e635] border-b-[#65a30d] border-r-[#65a30d]";
    }
  } else if (type.includes("sunflower")) {
    for (let i = 3; i < columns; i += 6) {
      rows[0][i] = "bg-[#ea580c] border-t-[#f97316] border-l-[#f97316] border-b-[#c2410c] border-r-[#c2410c]"; // Center
      rows[0][i-1] = "bg-[#fef08a] border-t-[#fef9c3] border-l-[#fef9c3] border-b-[#fde047] border-r-[#fde047]"; // Petal
      rows[0][i+1] = "bg-[#fef08a] border-t-[#fef9c3] border-l-[#fef9c3] border-b-[#fde047] border-r-[#fde047]"; // Petal
      rows[1][i] = "bg-[#22c55e] border-t-[#4ade80] border-l-[#4ade80] border-b-[#16a34a] border-r-[#16a34a]"; // Stalk
      rows[2][i] = "bg-[#16a34a] border-t-[#22c55e] border-l-[#22c55e] border-b-[#15803d] border-r-[#15803d]"; // Base
    }
  } else if (type.includes("grape") || type.includes("vine")) {
    for (let i = 1; i < columns; i += 5) {
      rows[1][i] = "bg-[#a855f7] border-t-[#c084fc] border-l-[#c084fc] border-b-[#9333ea] border-r-[#9333ea]"; // Grape
      rows[0][i] = "bg-[#22c55e] border-t-[#4ade80] border-l-[#4ade80] border-b-[#16a34a] border-r-[#16a34a]"; // Leaf
      rows[1][i+1] = "bg-[#16a34a] border-t-[#22c55e] border-l-[#22c55e] border-b-[#15803d] border-r-[#15803d]"; // Vine
      rows[2][i+1] = "bg-[#15803d] border-t-[#16a34a] border-l-[#16a34a] border-b-[#14532d] border-r-[#14532d]"; // Vine
    }
  } else if (type.includes("tomato") || type.includes("pepper")) {
    for (let i = 2; i < columns; i += 4) {
      rows[0][i] = "bg-[#22c55e] border-t-[#4ade80] border-l-[#4ade80] border-b-[#16a34a] border-r-[#16a34a]"; // Leaf
      rows[1][i-1] = "bg-[#ef4444] border-t-[#f87171] border-l-[#f87171] border-b-[#dc2626] border-r-[#dc2626]"; // Tomato
      rows[1][i] = "bg-[#16a34a] border-t-[#22c55e] border-l-[#22c55e] border-b-[#15803d] border-r-[#15803d]"; // Stalk
      rows[2][i] = "bg-[#15803d] border-t-[#16a34a] border-l-[#16a34a] border-b-[#14532d] border-r-[#14532d]"; // Base
    }
  } else {
    // Generic
    for (let i = 2; i < columns; i += 4) {
      rows[1][i] = "bg-[#4ade80] border-t-[#86efac] border-l-[#86efac] border-b-[#22c55e] border-r-[#22c55e]"; 
      rows[2][i] = "bg-[#22c55e] border-t-[#4ade80] border-l-[#4ade80] border-b-[#16a34a] border-r-[#16a34a]"; 
    }
  }
  return rows;
};
