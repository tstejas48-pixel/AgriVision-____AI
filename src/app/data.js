export const LANGUAGES = ['English', 'हिन्दी (Hindi)', 'ਪੰਜਾਬੀ (Punjabi)', 'मराठी (Marathi)', 'తెలుగు (Telugu)', 'தமிழ் (Tamil)', 'ગુજરાતી (Gujarati)', 'ಕನ್ನಡ (Kannada)', 'বাংলা (Bengali)', 'ଓଡ଼ିଆ (Odia)'];

export const DISTRICTS = {
  'Andhra Pradesh': ['Guntur', 'Krishna', 'Kurnool', 'Visakhapatnam', 'Chittoor', 'Anantapur'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia'],
  Gujarat: ['Ahmedabad', 'Rajkot', 'Surat', 'Vadodara', 'Junagadh', 'Mehsana'],
  Haryana: ['Karnal', 'Hisar', 'Rohtak', 'Ambala', 'Sirsa', 'Kurukshetra'],
  Karnataka: ['Belagavi', 'Mysuru', 'Dharwad', 'Mandya', 'Tumakuru', 'Raichur'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Sehore', 'Ujjain', 'Hoshangabad'],
  Maharashtra: ['Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Kolhapur', 'Solapur'],
  Odisha: ['Cuttack', 'Khordha', 'Ganjam', 'Sambalpur', 'Balasore', 'Koraput'],
  Punjab: ['Ludhiana', 'Amritsar', 'Patiala', 'Bathinda', 'Jalandhar', 'Sangrur'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Kota', 'Alwar', 'Sri Ganganagar', 'Bikaner'],
  'Tamil Nadu': ['Thanjavur', 'Coimbatore', 'Madurai', 'Salem', 'Erode', 'Tiruchirappalli'],
  Telangana: ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam', 'Nalgonda'],
  'Uttar Pradesh': ['Lucknow', 'Agra', 'Meerut', 'Varanasi', 'Kanpur', 'Gorakhpur'],
  'West Bengal': ['Kolkata', 'Nadia', 'Burdwan', 'Hooghly', 'Murshidabad', 'Bankura'],
};

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

/**
 * Crop reference values (general guidance only – soil testing is always best).
 * npk: kg per hectare of N / P2O5 / K2O.  tgw: weight of 1000 seeds (g).
 * row/plant: usual spacing in cm.  mm: daily water need (mm/day).
 */
export const CROPS = {
  wheat: { name: 'Wheat', emoji: '🌾', npk: [120, 60, 40], tgw: 40, row: 22.5, plant: 2.5, perHill: 1, mm: 4 },
  rice: { name: 'Rice (Paddy)', emoji: '🌾', npk: [120, 60, 40], tgw: 25, row: 20, plant: 15, perHill: 2, mm: 7 },
  maize: { name: 'Maize', emoji: '🌽', npk: [120, 60, 40], tgw: 285, row: 60, plant: 20, perHill: 1, mm: 5 },
  cotton: { name: 'Cotton', emoji: '☁️', npk: [150, 60, 60], tgw: 100, row: 90, plant: 60, perHill: 1, mm: 5 },
  soybean: { name: 'Soybean', emoji: '🫘', npk: [30, 60, 40], tgw: 120, row: 45, plant: 5, perHill: 1, mm: 4.5 },
  mustard: { name: 'Mustard', emoji: '🌼', npk: [80, 40, 40], tgw: 5, row: 30, plant: 10, perHill: 1, mm: 3.5 },
  potato: { name: 'Potato', emoji: '🥔', npk: [150, 60, 100], tgw: 40000, row: 60, plant: 20, perHill: 1, mm: 4 },
  tomato: { name: 'Tomato', emoji: '🍅', npk: [120, 80, 60], tgw: 3, row: 60, plant: 45, perHill: 1, mm: 5 },
  sugarcane: { name: 'Sugarcane', emoji: '🎋', npk: [250, 100, 120], tgw: 0, row: 90, plant: 30, perHill: 1, mm: 6 },
};

export const SEED_CROPS = Object.keys(CROPS).filter((k) => CROPS[k].tgw > 0);

/** Demo "diagnosis" knowledge base: [yellowing-type, spotting-type] per crop. */
export const DISEASES = {
  wheat: [
    { name: 'Yellow Rust', kind: 'Fungus', severity: 'warning', why: 'Yellow-orange stripes on leaves.', steps: ['Spray a recommended fungicide (for example propiconazole) as advised by your local agriculture office.', 'Spray in the evening when it is calm and dry.', 'Check nearby fields and tell your neighbours.'], prevent: ['Grow rust-resistant varieties.', 'Avoid too much nitrogen fertilizer.', 'Scout the field every week in cool, foggy weather.'] },
    { name: 'Leaf Blight', kind: 'Fungus', severity: 'warning', why: 'Brown oval spots on leaves.', steps: ['Remove badly spotted leaves if the field is small.', 'Spray a recommended fungicide such as mancozeb.', 'Avoid watering late in the day.'], prevent: ['Use treated, healthy seed.', 'Rotate crops every season.'] },
  ],
  rice: [
    { name: 'Bacterial Leaf Blight', kind: 'Bacteria', severity: 'danger', why: 'Leaves turn yellow from the tips and dry out.', steps: ['Drain the field for a few days if possible.', 'Stop adding extra nitrogen fertilizer.', 'Ask your agriculture officer about a copper-based spray.'], prevent: ['Use clean certified seed.', 'Keep bunds free from weeds.'] },
    { name: 'Rice Blast', kind: 'Fungus', severity: 'danger', why: 'Diamond-shaped spots with grey centres.', steps: ['Spray a recommended fungicide such as tricyclazole.', 'Avoid heavy nitrogen doses.', 'Keep water level steady.'], prevent: ['Plant resistant varieties.', 'Do not plant too densely.'] },
  ],
  maize: [
    { name: 'Nutrient Deficiency (Nitrogen)', kind: 'Nutrition', severity: 'info', why: 'V-shaped yellowing from the leaf tip.', steps: ['Apply urea as top-dressing (see Fertilizer Calculator).', 'Water the field after applying.'], prevent: ['Split nitrogen into 2–3 doses.', 'Add compost or farmyard manure.'] },
    { name: 'Northern Leaf Blight', kind: 'Fungus', severity: 'warning', why: 'Long grey-green cigar-shaped spots.', steps: ['Spray a recommended fungicide such as mancozeb.', 'Remove and burn crop leftovers after harvest.'], prevent: ['Use tolerant hybrids.', 'Rotate with a non-cereal crop.'] },
  ],
  cotton: [
    { name: 'Cotton Leaf Curl Virus', kind: 'Virus', severity: 'danger', why: 'Leaves curl upward and turn yellow.', steps: ['Remove and destroy badly infected plants.', 'Control whitefly (the insect that spreads it) as advised locally.', 'Use yellow sticky traps.'], prevent: ['Sow tolerant varieties.', 'Remove weeds around the field.'] },
    { name: 'Alternaria Leaf Spot', kind: 'Fungus', severity: 'warning', why: 'Brown round spots with rings.', steps: ['Spray a recommended fungicide.', 'Give potash if plants look weak.'], prevent: ['Balanced fertilizer.', 'Avoid water standing in the field.'] },
  ],
  soybean: [
    { name: 'Yellow Mosaic Virus', kind: 'Virus', severity: 'danger', why: 'Yellow and green patches on leaves.', steps: ['Pull out and destroy infected plants early.', 'Control whitefly as advised locally.'], prevent: ['Use resistant varieties.', 'Sow on time.'] },
    { name: 'Frogeye Leaf Spot', kind: 'Fungus', severity: 'warning', why: 'Small brown spots with a dark edge.', steps: ['Spray a recommended fungicide.', 'Avoid working in the field when leaves are wet.'], prevent: ['Use clean seed.', 'Rotate crops.'] },
  ],
  mustard: [
    { name: 'White Rust', kind: 'Fungus', severity: 'warning', why: 'White blisters under leaves and yellow patches on top.', steps: ['Spray a recommended fungicide such as metalaxyl + mancozeb.', 'Avoid too much irrigation.'], prevent: ['Sow on time.', 'Use treated seed.'] },
    { name: 'Alternaria Blight', kind: 'Fungus', severity: 'warning', why: 'Dark brown spots with rings.', steps: ['Spray mancozeb as advised.', 'Remove infected leaves from small plots.'], prevent: ['Use healthy seed.', 'Keep proper plant spacing.'] },
  ],
  potato: [
    { name: 'Early Blight', kind: 'Fungus', severity: 'warning', why: 'Dark spots with rings on older leaves.', steps: ['Spray mancozeb as advised.', 'Remove badly affected leaves.', 'Keep the plants well fed.'], prevent: ['Rotate crops every year.', 'Use healthy seed tubers.'] },
    { name: 'Late Blight', kind: 'Fungus', severity: 'danger', why: 'Dark wet-looking patches on leaves that spread fast.', steps: ['Act today – this disease spreads in 2–3 days in cool, humid weather.', 'Spray a recommended fungicide (for example cymoxanil + mancozeb).', 'Do not irrigate in the evening.'], prevent: ['Plant certified seed tubers.', 'Earth up soil around plants.', 'Watch the weather forecast.'] },
  ],
  tomato: [
    { name: 'Tomato Leaf Curl Virus', kind: 'Virus', severity: 'danger', why: 'Leaves curl, turn yellow and plants stay small.', steps: ['Remove infected plants.', 'Control whitefly as advised locally.', 'Use yellow sticky traps.'], prevent: ['Use net-covered nurseries.', 'Choose tolerant varieties.'] },
    { name: 'Early Blight', kind: 'Fungus', severity: 'warning', why: 'Brown spots with rings on lower leaves.', steps: ['Remove lower infected leaves.', 'Spray mancozeb or chlorothalonil as advised.', 'Water at the base, not on leaves.'], prevent: ['Mulch the soil.', 'Stake plants for air flow.'] },
  ],
  sugarcane: [
    { name: 'Red Rot', kind: 'Fungus', severity: 'danger', why: 'Leaves dry from the top and cane inside turns red.', steps: ['Remove and destroy infected clumps.', 'Do not use cane from this field as seed.', 'Contact your sugar mill field officer.'], prevent: ['Use disease-free setts.', 'Treat setts before planting.'] },
    { name: 'Leaf Spot', kind: 'Fungus', severity: 'info', why: 'Small brown spots on leaves.', steps: ['Usually mild. Keep the field clean and well drained.', 'Spray a recommended fungicide only if it spreads.'], prevent: ['Balanced fertilizer.', 'Remove old dry leaves.'] },
  ],
};

export const SAMPLE_ALERTS = [
  { id: 'a1', level: 'danger', title: 'Late blight risk – potato & tomato', text: 'Cool, humid weather helps blight spread. Check lower leaves for dark wet patches.', time: 2 * 3600e3 },
  { id: 'a2', level: 'warning', title: 'Fall armyworm in maize', text: 'Look for small holes and sawdust-like droppings inside young leaf whorls.', time: 26 * 3600e3 },
  { id: 'a3', level: 'warning', title: 'Yellow rust in wheat', text: 'Foggy mornings can bring yellow stripes on wheat leaves. Check your field this week.', time: 3 * 864e5 },
  { id: 'a4', level: 'info', title: 'Tip: Soil test before sowing', text: 'A soil test tells you exactly which fertilizer you need and can save money.', time: 5 * 864e5 },
];

export const SHOP_TYPES = ['All', 'Seeds', 'Fertilizer', 'Pesticide', 'Equipment', 'Mandi'];
export const SAMPLE_SHOPS = [
  { id: 's1', name: 'Kisan Seed Centre', type: 'Seeds', km: 1.2, rating: 4.6, hours: '8 am – 8 pm', info: 'Certified seeds, saplings' },
  { id: 's2', name: 'Green Field Fertilizers', type: 'Fertilizer', km: 2.4, rating: 4.4, hours: '9 am – 7 pm', info: 'Urea, DAP, MOP, organic manure' },
  { id: 's3', name: 'Agro Care Pesticides', type: 'Pesticide', km: 3.1, rating: 4.2, hours: '9 am – 6 pm', info: 'Pesticides & advice' },
  { id: 's4', name: 'Shakti Farm Equipment', type: 'Equipment', km: 4.8, rating: 4.5, hours: '10 am – 6 pm', info: 'Sprayers, pumps, tools' },
  { id: 's5', name: 'Krishi Mandi (Market Yard)', type: 'Mandi', km: 6.0, rating: 4.1, hours: '6 am – 2 pm', info: 'Daily crop market' },
  { id: 's6', name: 'Annapurna Agro Store', type: 'Fertilizer', km: 7.3, rating: 4.3, hours: '8 am – 7 pm', info: 'Fertilizer & seeds' },
];

export const ASSISTANT_QUICK = ['How much water for wheat?', 'My leaves are turning yellow', 'When should I spray?', 'How to increase profit?'];

export const ASSISTANT_KB = [
  { keys: ['hello', 'hi ', 'namaste', 'hey'], a: 'Namaste! 🌱 I can help with crop problems, water, fertilizer and farm costs. What would you like to know?' },
  { keys: ['yellow', 'turning yellow', 'pale'], a: 'Yellow leaves can mean: (1) not enough nitrogen – try urea top-dressing, (2) too much or too little water, or (3) a disease or insect. Take a clear photo of the leaf in the Diagnose tab to check.', link: ['#/diagnose', 'Check a leaf'] },
  { keys: ['water', 'irrigat', 'pani'], a: 'Water need depends on the crop, weather and soil. Wheat needs about 4 mm a day, maize about 5 mm, and rice about 7 mm. Water early morning or evening to save water. Use the Water Calculator to find the exact amount.', link: ['#/tools/water', 'Open Water Calculator'] },
  { keys: ['fertil', 'urea', 'dap', 'npk', 'khad'], a: 'The right fertilizer depends on your crop and soil. Split nitrogen (urea) into 2–3 doses instead of one. A soil test is the best guide. Use the Fertilizer Calculator for a general plan.', link: ['#/tools/fertilizer', 'Open Fertilizer Calculator'] },
  { keys: ['spray', 'pesticide', 'insect', 'pest', 'bug'], a: 'Spray in the early morning or evening when there is little wind and no rain expected. Always wear a mask and gloves, and follow the label. Ask your local agriculture officer before using a new chemical.' },
  { keys: ['rain', 'weather', 'mausam'], a: 'Check the weather card on the Home screen. Avoid spraying or fertilizing if rain is expected in the next 24 hours.', link: ['#/home', 'Go to Home'] },
  { keys: ['profit', 'income', 'money', 'cost', 'price'], a: 'To increase profit: test your soil to avoid wasting fertilizer, buy seed early, save water and compare mandi prices before selling. Use the Profit Calculator to see your costs clearly.', link: ['#/tools/profit', 'Open Profit Calculator'] },
  { keys: ['seed', 'sowing', 'spacing', 'beej'], a: 'Seed need depends on spacing and seed size. Use certified seed with good germination. The Seed Calculator tells you how many kilograms you need.', link: ['#/tools/seed', 'Open Seed Calculator'] },
  { keys: ['soil', 'mitti'], a: 'A soil test (usually free or low cost at your nearest Krishi Vigyan Kendra) shows nutrients and pH. Test every 2–3 years.' },
  { keys: ['shop', 'buy', 'store'], a: 'You can find shops and the market yard in the Shops tab.', link: ['#/shops', 'Open Shops'] },
  { keys: ['thank'], a: 'You are welcome! 🌾 Happy farming.' },
];
