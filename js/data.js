/* =========================================================
   Data: periodiek systeem, reactievergelijkingen, naamgeving
   ========================================================= */

/* ---------- Periodiek systeem ----------
   [atoomnummer, symbool, naam, atoommassa (u)]
   Massa's tussen haakjes = massagetal van de meest stabiele isotoop. */
const ELEMENTS_RAW = [
  [1,"H","waterstof","1,008"],[2,"He","helium","4,003"],[3,"Li","lithium","6,94"],
  [4,"Be","beryllium","9,012"],[5,"B","boor","10,81"],[6,"C","koolstof","12,01"],
  [7,"N","stikstof","14,01"],[8,"O","zuurstof","16,00"],[9,"F","fluor","19,00"],
  [10,"Ne","neon","20,18"],[11,"Na","natrium","22,99"],[12,"Mg","magnesium","24,31"],
  [13,"Al","aluminium","26,98"],[14,"Si","silicium","28,09"],[15,"P","fosfor","30,97"],
  [16,"S","zwavel","32,06"],[17,"Cl","chloor","35,45"],[18,"Ar","argon","39,95"],
  [19,"K","kalium","39,10"],[20,"Ca","calcium","40,08"],[21,"Sc","scandium","44,96"],
  [22,"Ti","titaan","47,87"],[23,"V","vanadium","50,94"],[24,"Cr","chroom","52,00"],
  [25,"Mn","mangaan","54,94"],[26,"Fe","ijzer","55,85"],[27,"Co","kobalt","58,93"],
  [28,"Ni","nikkel","58,69"],[29,"Cu","koper","63,55"],[30,"Zn","zink","65,38"],
  [31,"Ga","gallium","69,72"],[32,"Ge","germanium","72,63"],[33,"As","arseen","74,92"],
  [34,"Se","seleen","78,97"],[35,"Br","broom","79,90"],[36,"Kr","krypton","83,80"],
  [37,"Rb","rubidium","85,47"],[38,"Sr","strontium","87,62"],[39,"Y","yttrium","88,91"],
  [40,"Zr","zirkonium","91,22"],[41,"Nb","niobium","92,91"],[42,"Mo","molybdeen","95,95"],
  [43,"Tc","technetium","(98)"],[44,"Ru","ruthenium","101,07"],[45,"Rh","rodium","102,91"],
  [46,"Pd","palladium","106,42"],[47,"Ag","zilver","107,87"],[48,"Cd","cadmium","112,41"],
  [49,"In","indium","114,82"],[50,"Sn","tin","118,71"],[51,"Sb","antimoon","121,76"],
  [52,"Te","telluur","127,60"],[53,"I","jood","126,90"],[54,"Xe","xenon","131,29"],
  [55,"Cs","cesium","132,91"],[56,"Ba","barium","137,33"],[57,"La","lanthaan","138,91"],
  [58,"Ce","cerium","140,12"],[59,"Pr","praseodymium","140,91"],[60,"Nd","neodymium","144,24"],
  [61,"Pm","promethium","(145)"],[62,"Sm","samarium","150,36"],[63,"Eu","europium","151,96"],
  [64,"Gd","gadolinium","157,25"],[65,"Tb","terbium","158,93"],[66,"Dy","dysprosium","162,50"],
  [67,"Ho","holmium","164,93"],[68,"Er","erbium","167,26"],[69,"Tm","thulium","168,93"],
  [70,"Yb","ytterbium","173,05"],[71,"Lu","lutetium","174,97"],[72,"Hf","hafnium","178,49"],
  [73,"Ta","tantaal","180,95"],[74,"W","wolfraam","183,84"],[75,"Re","renium","186,21"],
  [76,"Os","osmium","190,23"],[77,"Ir","iridium","192,22"],[78,"Pt","platina","195,08"],
  [79,"Au","goud","196,97"],[80,"Hg","kwik","200,59"],[81,"Tl","thallium","204,38"],
  [82,"Pb","lood","207,2"],[83,"Bi","bismut","208,98"],[84,"Po","polonium","(209)"],
  [85,"At","astaat","(210)"],[86,"Rn","radon","(222)"],[87,"Fr","francium","(223)"],
  [88,"Ra","radium","(226)"],[89,"Ac","actinium","(227)"],[90,"Th","thorium","232,04"],
  [91,"Pa","protactinium","231,04"],[92,"U","uraan","238,03"],[93,"Np","neptunium","(237)"],
  [94,"Pu","plutonium","(244)"],[95,"Am","americium","(243)"],[96,"Cm","curium","(247)"],
  [97,"Bk","berkelium","(247)"],[98,"Cf","californium","(251)"],[99,"Es","einsteinium","(252)"],
  [100,"Fm","fermium","(257)"],[101,"Md","mendelevium","(258)"],[102,"No","nobelium","(259)"],
  [103,"Lr","lawrencium","(266)"],[104,"Rf","rutherfordium","(267)"],[105,"Db","dubnium","(268)"],
  [106,"Sg","seaborgium","(269)"],[107,"Bh","bohrium","(270)"],[108,"Hs","hassium","(269)"],
  [109,"Mt","meitnerium","(278)"],[110,"Ds","darmstadtium","(281)"],[111,"Rg","roentgenium","(282)"],
  [112,"Cn","copernicium","(285)"],[113,"Nh","nihonium","(286)"],[114,"Fl","flerovium","(289)"],
  [115,"Mc","moscovium","(290)"],[116,"Lv","livermorium","(293)"],[117,"Ts","tennessine","(294)"],
  [118,"Og","oganesson","(294)"]
];

const NOBLE = [2,10,18,36,54,86,118];
const NONMETAL = [1,6,7,8,9,15,16,17,34,35,53];
const METALLOID = [5,14,32,33,51,52];
const DIATOMIC = ["H","N","O","F","Cl","Br","I"];

function elementCategory(z) {
  if (NOBLE.includes(z)) return "edelgas";
  if (NONMETAL.includes(z)) return "nietmetaal";
  if (METALLOID.includes(z)) return "halfmetaal";
  return "metaal";
}

/* rij/kolom in het periodiek systeem */
function elementPosition(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 4) return [2, z - 2];
  if (z <= 10) return [2, z + 8];
  if (z <= 12) return [3, z - 10];
  if (z <= 18) return [3, z];
  if (z <= 36) return [4, z - 18];
  if (z <= 54) return [5, z - 36];
  if (z <= 56) return [6, z - 54];
  if (z <= 71) return [9, z - 54];      // lanthaniden: kolom 3–17
  if (z <= 86) return [6, z - 68];
  if (z <= 88) return [7, z - 86];
  if (z <= 103) return [10, z - 86];    // actiniden: kolom 3–17
  return [7, z - 100];
}

const ELEMENTS = ELEMENTS_RAW.map(([z, sym, name, mass]) => {
  const [row, col] = elementPosition(z);
  return { z, sym, name, mass, row, col, cat: elementCategory(z), diatomic: DIATOMIC.includes(sym) };
});
const ELEMENT_BY_SYMBOL = Object.fromEntries(ELEMENTS.map(e => [e.sym, e]));

/* ---------- Reactievergelijkingen ----------
   r = beginstoffen, p = reactieproducten, c = coëfficiënten (kleinste gehele getallen)
   lvl 1 = makkelijk, 2 = gemiddeld, 3 = moeilijk */
const REACTIONS = [
  // ---- niveau 1 ----
  { id: "r01", lvl: 1, d: "Vorming van water uit waterstof en zuurstof", r: ["H2","O2"], p: ["H2O"], c: [2,1,2] },
  { id: "r02", lvl: 1, d: "Ontleding van water (elektrolyse)", r: ["H2O"], p: ["H2","O2"], c: [2,2,1] },
  { id: "r03", lvl: 1, d: "Vorming van ammoniak", r: ["N2","H2"], p: ["NH3"], c: [1,3,2] },
  { id: "r04", lvl: 1, d: "Verbranding van magnesium", r: ["Mg","O2"], p: ["MgO"], c: [2,1,2] },
  { id: "r05", lvl: 1, d: "Onvolledige verbranding van koolstof", r: ["C","O2"], p: ["CO"], c: [2,1,2] },
  { id: "r06", lvl: 1, d: "Ontleding van waterstofperoxide", r: ["H2O2"], p: ["H2O","O2"], c: [2,2,1] },
  { id: "r07", lvl: 1, d: "Ontleding van kwikoxide", r: ["HgO"], p: ["Hg","O2"], c: [2,2,1] },
  { id: "r08", lvl: 1, d: "Natrium reageert met chloor", r: ["Na","Cl2"], p: ["NaCl"], c: [2,1,2] },
  { id: "r09", lvl: 1, d: "Verbranding van koolstofmono-oxide", r: ["CO","O2"], p: ["CO2"], c: [2,1,2] },
  { id: "r10", lvl: 1, d: "Verbranding van zwavel", r: ["S","O2"], p: ["SO2"], c: [1,1,1] },
  { id: "r11", lvl: 1, d: "Vorming van zwaveltrioxide", r: ["SO2","O2"], p: ["SO3"], c: [2,1,2] },
  { id: "r12", lvl: 1, d: "Waterstof reageert met chloor", r: ["H2","Cl2"], p: ["HCl"], c: [1,1,2] },
  { id: "r13", lvl: 1, d: "Verbranding van koper", r: ["Cu","O2"], p: ["CuO"], c: [2,1,2] },
  { id: "r14", lvl: 1, d: "Stikstofmono-oxide reageert met zuurstof", r: ["NO","O2"], p: ["NO2"], c: [2,1,2] },
  { id: "r15", lvl: 1, d: "Ontleding van zilveroxide", r: ["Ag2O"], p: ["Ag","O2"], c: [2,4,1] },
  { id: "r16", lvl: 1, d: "Kalium reageert met broom", r: ["K","Br2"], p: ["KBr"], c: [2,1,2] },
  // ---- niveau 2 ----
  { id: "r17", lvl: 2, d: "Volledige verbranding van methaan (aardgas)", r: ["CH4","O2"], p: ["CO2","H2O"], c: [1,2,1,2] },
  { id: "r18", lvl: 2, d: "Roesten van ijzer", r: ["Fe","O2"], p: ["Fe2O3"], c: [4,3,2] },
  { id: "r19", lvl: 2, d: "Verbranding van aluminium", r: ["Al","O2"], p: ["Al2O3"], c: [4,3,2] },
  { id: "r20", lvl: 2, d: "Aluminium reageert met chloor", r: ["Al","Cl2"], p: ["AlCl3"], c: [2,3,2] },
  { id: "r21", lvl: 2, d: "Natrium reageert met water", r: ["Na","H2O"], p: ["NaOH","H2"], c: [2,2,2,1] },
  { id: "r22", lvl: 2, d: "Zink reageert met zoutzuur", r: ["Zn","HCl"], p: ["ZnCl2","H2"], c: [1,2,1,1] },
  { id: "r23", lvl: 2, d: "Vorming van stikstofdioxide", r: ["N2","O2"], p: ["NO2"], c: [1,2,2] },
  { id: "r24", lvl: 2, d: "Verbranding van fosfor", r: ["P4","O2"], p: ["P4O10"], c: [1,5,1] },
  { id: "r25", lvl: 2, d: "Koperoxide reageert met koolstof", r: ["CuO","C"], p: ["Cu","CO2"], c: [2,1,2,1] },
  { id: "r26", lvl: 2, d: "Verbranding van lithium", r: ["Li","O2"], p: ["Li2O"], c: [4,1,2] },
  { id: "r27", lvl: 2, d: "IJzer reageert met chloor", r: ["Fe","Cl2"], p: ["FeCl3"], c: [2,3,2] },
  { id: "r28", lvl: 2, d: "Verbranding van waterstofsulfide", r: ["H2S","O2"], p: ["SO2","H2O"], c: [2,3,2,2] },
  { id: "r29", lvl: 2, d: "Ontleding van distikstofpentaoxide", r: ["N2O5"], p: ["NO2","O2"], c: [2,4,1] },
  { id: "r30", lvl: 2, d: "Ontleding van kaliumchloraat", r: ["KClO3"], p: ["KCl","O2"], c: [2,2,3] },
  { id: "r31", lvl: 2, d: "Calcium reageert met water", r: ["Ca","H2O"], p: ["Ca(OH)2","H2"], c: [1,2,1,1] },
  { id: "r32", lvl: 2, d: "Volledige verbranding van propaan", r: ["C3H8","O2"], p: ["CO2","H2O"], c: [1,5,3,4] },
  { id: "r33", lvl: 2, d: "Verbranding van koolstofdisulfide", r: ["CS2","O2"], p: ["CO2","SO2"], c: [1,3,1,2] },
  { id: "r34", lvl: 2, d: "IJzererts reageert met koolstof", r: ["Fe2O3","C"], p: ["Fe","CO2"], c: [2,3,4,3] },
  // ---- niveau 3 ----
  { id: "r35", lvl: 3, d: "Volledige verbranding van ethaan", r: ["C2H6","O2"], p: ["CO2","H2O"], c: [2,7,4,6] },
  { id: "r36", lvl: 3, d: "Volledige verbranding van butaan", r: ["C4H10","O2"], p: ["CO2","H2O"], c: [2,13,8,10] },
  { id: "r37", lvl: 3, d: "Verbranding van glucose (verbranding in je lichaam)", r: ["C6H12O6","O2"], p: ["CO2","H2O"], c: [1,6,6,6] },
  { id: "r38", lvl: 3, d: "Fotosynthese", r: ["CO2","H2O"], p: ["C6H12O6","O2"], c: [6,6,1,6] },
  { id: "r39", lvl: 3, d: "Volledige verbranding van ethanol (alcohol)", r: ["C2H6O","O2"], p: ["CO2","H2O"], c: [1,3,2,3] },
  { id: "r40", lvl: 3, d: "Verbranding van ammoniak", r: ["NH3","O2"], p: ["N2","H2O"], c: [4,3,2,6] },
  { id: "r41", lvl: 3, d: "Ammoniak reageert met zuurstof tot stikstofmono-oxide", r: ["NH3","O2"], p: ["NO","H2O"], c: [4,5,4,6] },
  { id: "r42", lvl: 3, d: "IJzererts reageert met koolstofmono-oxide (hoogoven)", r: ["Fe2O3","CO"], p: ["Fe","CO2"], c: [1,3,2,3] },
  { id: "r43", lvl: 3, d: "Volledige verbranding van octaan (benzine)", r: ["C8H18","O2"], p: ["CO2","H2O"], c: [2,25,16,18] },
  { id: "r44", lvl: 3, d: "Ontleding van natriumwaterstofcarbonaat (bakpoeder)", r: ["NaHCO3"], p: ["Na2CO3","H2O","CO2"], c: [2,1,1,1] },
  { id: "r45", lvl: 3, d: "Aluminium reageert met zoutzuur", r: ["Al","HCl"], p: ["AlCl3","H2"], c: [2,6,2,3] },
  { id: "r46", lvl: 3, d: "Volledige verbranding van ethyn (acetyleen)", r: ["C2H2","O2"], p: ["CO2","H2O"], c: [2,5,4,2] },
  { id: "r47", lvl: 3, d: "Roosten van pyriet", r: ["FeS2","O2"], p: ["Fe2O3","SO2"], c: [4,11,2,8] },
  { id: "r48", lvl: 3, d: "Volledige verbranding van suiker (sacharose)", r: ["C12H22O11","O2"], p: ["CO2","H2O"], c: [1,12,12,11] },
  { id: "r49", lvl: 3, d: "Ontleding van loodnitraat", r: ["Pb(NO3)2"], p: ["PbO","NO2","O2"], c: [2,2,4,1] },
  { id: "r50", lvl: 3, d: "Onvolledige verbranding van methaan", r: ["CH4","O2"], p: ["CO","H2O"], c: [2,3,2,4] },
  { id: "r51", lvl: 3, d: "Volledige verbranding van pentaan", r: ["C5H12","O2"], p: ["CO2","H2O"], c: [1,8,5,6] },
  // ---- extra reacties met alleen niet-metalen ----
  { id: "r52", lvl: 1, d: "Vorming van stikstofmono-oxide (bij onweer)", r: ["N2","O2"], p: ["NO"], c: [1,1,2] },
  { id: "r53", lvl: 1, d: "Stikstofdioxide vormt distikstoftetraoxide", r: ["NO2"], p: ["N2O4"], c: [2,1] },
  { id: "r54", lvl: 1, d: "Koolstof reageert met waterstof tot methaan", r: ["C","H2"], p: ["CH4"], c: [1,2,1] },
  { id: "r55", lvl: 1, d: "Waterstof reageert met fluor", r: ["H2","F2"], p: ["HF"], c: [1,1,2] },
  { id: "r56", lvl: 2, d: "Stikstof reageert met fluor", r: ["N2","F2"], p: ["NF3"], c: [1,3,2] },
  { id: "r57", lvl: 2, d: "Fosfor reageert met chloor", r: ["P4","Cl2"], p: ["PCl3"], c: [1,6,4] },
  { id: "r58", lvl: 2, d: "Methaan reageert met chloor", r: ["CH4","Cl2"], p: ["CCl4","HCl"], c: [1,4,1,4] },
  { id: "r59", lvl: 2, d: "Volledige verbranding van etheen", r: ["C2H4","O2"], p: ["CO2","H2O"], c: [1,3,2,2] },
  { id: "r60", lvl: 2, d: "Methaan reageert met stoom (productie van waterstof)", r: ["CH4","H2O"], p: ["CO","H2"], c: [1,1,1,3] },
  { id: "r61", lvl: 2, d: "Onvolledige verbranding van fosfor", r: ["P4","O2"], p: ["P4O6"], c: [1,3,1] },
  { id: "r62", lvl: 2, d: "Vorming van methanol", r: ["CO","H2"], p: ["CH4O"], c: [1,2,1] },
  { id: "r63", lvl: 2, d: "Zwavel reageert met chloor", r: ["S","Cl2"], p: ["S2Cl2"], c: [2,1,1] },
  { id: "r64", lvl: 3, d: "Stikstofdioxide reageert met water", r: ["NO2","H2O"], p: ["HNO3","NO"], c: [3,1,2,1] },
  { id: "r65", lvl: 3, d: "Waterstofsulfide reageert met zwaveldioxide", r: ["H2S","SO2"], p: ["S","H2O"], c: [2,1,3,2] },
  { id: "r66", lvl: 3, d: "Volledige verbranding van propeen", r: ["C3H6","O2"], p: ["CO2","H2O"], c: [2,9,6,6] },
  { id: "r67", lvl: 3, d: "Ammoniak reageert met fluor", r: ["NH3","F2"], p: ["NF3","HF"], c: [1,3,1,3] }
];

/* Elementen die als 'niet-metaal' gelden voor de weging van vragen */
const NONMETAL_SYMBOLS = ["H","He","B","C","N","O","F","Ne","Si","P","S","Cl","Ar","Se","Br","Kr","I","Xe"];
const NONMETAL_WEIGHT = 4;   // vragen met alleen niet-metalen komen zo veel vaker voor

/* ---------- Naamgeving ---------- */

const PREFIXES = ["", "mono", "di", "tri", "tetra", "penta", "hexa"];

/* naam van het element als eerste deel van de naam */
const FIRST_NAME = {
  C: "koolstof", S: "zwavel", N: "stikstof", P: "fosfor", Cl: "chloor", Si: "silicium",
  B: "boor", Xe: "xenon", I: "jood", O: "zuurstof", Se: "seleen", Br: "broom", H: "waterstof"
};
/* naam van het element als tweede deel (uitgang -ide) */
const SECOND_NAME = {
  O: "oxide", S: "sulfide", Cl: "chloride", F: "fluoride", Br: "bromide",
  I: "jodide"
};

/* Moleculaire stoffen uit twee niet-metalen */
const MOLECULAR = [
  "CO","CO2","SO2","SO3","NO","NO2","N2O","N2O3","N2O4","N2O5","P2O5","P4O6",
  "CS2","CCl4","CBr4","PCl3","PCl5","SF6","Cl2O","ClO2","SiO2","SiF4","SiCl4",
  "BF3","B2O3","NCl3","NF3","NI3","SCl2","S2Cl2","XeF4","IF5","OF2","P4S3","SeO2"
];

/* Triviale namen die je uit je hoofd moet kennen */
const TRIVIAL = [
  { f: "H2O", n: "water", alt: [] , info: "Water is een triviale naam. De systematische naam zou diwaterstofmono-oxide zijn, maar die gebruikt niemand." },
  { f: "NH3", n: "ammoniak", alt: [], info: "Ammoniak is een triviale naam die je moet kennen." },
  { f: "CH4", n: "methaan", alt: [], info: "Methaan is het hoofdbestanddeel van aardgas." },
  { f: "O3", n: "ozon", alt: [], info: "Ozon bestaat uit moleculen van drie zuurstofatomen." },
  { f: "C6H12O6", n: "glucose", alt: ["druivensuiker"], info: "Glucose (druivensuiker) ontstaat bij fotosynthese." },
  { f: "C2H6O", n: "ethanol", alt: ["alcohol"], info: "Ethanol is de 'alcohol' in alcoholische dranken." },
  { f: "H2O2", n: "waterstofperoxide", alt: [], info: "Waterstofperoxide wordt o.a. gebruikt als bleekmiddel." },
  { f: "C12H22O11", n: "sacharose", alt: ["suiker", "rietsuiker", "kristalsuiker"], info: "Sacharose is gewone (kristal)suiker." }
];

/* Elementen waarvan je naam en symbool moet kennen */
const COMMON_ELEMENTS = [
  "H","He","Li","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar","K","Ca",
  "Cr","Mn","Fe","Co","Ni","Cu","Zn","Br","Ag","Sn","I","Ba","Pt","Au","Hg","Pb","U"
];
