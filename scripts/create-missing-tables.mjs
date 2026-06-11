import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Create missing tables
await connection.execute(`
  CREATE TABLE IF NOT EXISTS \`suburbs\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(100) NOT NULL,
    \`postcode\` varchar(10) NOT NULL,
    \`lga\` varchar(100),
    \`zone\` enum('inner','middle','outer') NOT NULL,
    \`isActive\` boolean NOT NULL DEFAULT true,
    CONSTRAINT \`suburbs_id\` PRIMARY KEY(\`id\`)
  )
`);
console.log("suburbs table created/verified");

await connection.execute(`
  CREATE TABLE IF NOT EXISTS \`service_products\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`providerId\` int NOT NULL,
    \`categoryId\` int NOT NULL,
    \`title\` varchar(200) NOT NULL,
    \`description\` text,
    \`priceType\` enum('fixed','hourly','quote') NOT NULL,
    \`priceAmount\` decimal(10,2),
    \`priceLabel\` varchar(100),
    \`coverageZones\` json,
    \`propertyTypes\` json,
    \`maxBedrooms\` int,
    \`introductionFee\` decimal(8,2) NOT NULL,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`service_products_id\` PRIMARY KEY(\`id\`)
  )
`);
console.log("service_products table created/verified");

// Seed service categories (ignore duplicates)
const categories = [
  ['removalist', 'Removalist', 'Professional furniture and household goods moving services for your move-out day.', 'Truck', 1],
  ['end-of-lease-cleaning', 'End-of-Lease Cleaning', 'Bond-back guaranteed cleaning services to ensure your rental property is spotless.', 'Sparkles', 2],
  ['carpet-cleaning', 'Carpet Cleaning', 'Deep steam and dry carpet cleaning to restore carpets to rental condition.', 'Wind', 3],
  ['pest-control', 'Pest Control', 'End-of-lease pest treatment including cockroach, flea, and rodent control.', 'Bug', 4],
  ['rubbish-removal', 'Rubbish Removal', 'Junk and hard rubbish collection to clear your property before final inspection.', 'Trash2', 5],
  ['handyman', 'Handyman', 'Minor repairs, wall patching, and maintenance to meet lease obligations.', 'Wrench', 6],
];

for (const [slug, name, desc, icon, order] of categories) {
  await connection.execute(
    `INSERT IGNORE INTO service_categories (slug, name, description, iconName, sortOrder, isActive) VALUES (?,?,?,?,?,1)`,
    [slug, name, desc, icon, order]
  );
}
console.log("service_categories seeded");

// Seed suburbs
const suburbs = [
  ["Melbourne CBD","3000","Melbourne","inner"],["Southbank","3006","Melbourne","inner"],
  ["Docklands","3008","Melbourne","inner"],["Carlton","3053","Melbourne","inner"],
  ["Fitzroy","3065","Yarra","inner"],["Collingwood","3066","Yarra","inner"],
  ["Richmond","3121","Yarra","inner"],["South Yarra","3141","Stonnington","inner"],
  ["Prahran","3181","Stonnington","inner"],["Windsor","3181","Stonnington","inner"],
  ["St Kilda","3182","Port Phillip","inner"],["Elwood","3184","Port Phillip","inner"],
  ["Port Melbourne","3207","Port Phillip","inner"],["Albert Park","3206","Port Phillip","inner"],
  ["South Melbourne","3205","Port Phillip","inner"],["North Melbourne","3051","Melbourne","inner"],
  ["West Melbourne","3003","Melbourne","inner"],["Kensington","3031","Melbourne","inner"],
  ["Flemington","3031","Melbourne","inner"],["Brunswick","3056","Moreland","inner"],
  ["Brunswick East","3057","Moreland","inner"],["Brunswick West","3055","Moreland","inner"],
  ["Coburg","3058","Moreland","inner"],["Northcote","3070","Darebin","inner"],
  ["Thornbury","3071","Darebin","inner"],["Preston","3072","Darebin","inner"],
  ["Reservoir","3073","Darebin","inner"],["Hawthorn","3122","Boroondara","inner"],
  ["Hawthorn East","3123","Boroondara","inner"],["Camberwell","3124","Boroondara","inner"],
  ["Glen Iris","3146","Boroondara","inner"],["Malvern","3144","Stonnington","inner"],
  ["Malvern East","3145","Stonnington","inner"],["Armadale","3143","Stonnington","inner"],
  ["Toorak","3142","Stonnington","inner"],["Caulfield","3162","Glen Eira","inner"],
  ["Caulfield North","3161","Glen Eira","inner"],["St Kilda East","3183","Glen Eira","inner"],
  ["Balaclava","3183","Port Phillip","inner"],["Abbotsford","3067","Yarra","inner"],
  ["Clifton Hill","3068","Yarra","inner"],["Parkville","3052","Melbourne","inner"],
  ["East Melbourne","3002","Melbourne","inner"],["Ascot Vale","3032","Moonee Valley","inner"],
  ["Moonee Ponds","3039","Moonee Valley","inner"],["Footscray","3011","Maribyrnong","inner"],
  ["Yarraville","3013","Maribyrnong","inner"],["Seddon","3011","Maribyrnong","inner"],
  ["Williamstown","3016","Hobsons Bay","inner"],["Newport","3015","Hobsons Bay","inner"],
  ["Kew","3101","Boroondara","inner"],["Kew East","3102","Boroondara","inner"],
  ["Alphington","3078","Darebin","inner"],["Fairfield","3078","Darebin","inner"],
  ["Fitzroy North","3068","Yarra","inner"],["Burnley","3121","Yarra","inner"],
  ["Cremorne","3121","Yarra","inner"],["Elsternwick","3185","Glen Eira","inner"],
  ["Essendon","3040","Moonee Valley","middle"],["Essendon North","3041","Moonee Valley","middle"],
  ["Altona","3018","Hobsons Bay","middle"],["Altona North","3025","Hobsons Bay","middle"],
  ["Sunshine","3020","Brimbank","middle"],["St Albans","3021","Brimbank","middle"],
  ["Deer Park","3023","Brimbank","middle"],["Keilor East","3033","Brimbank","middle"],
  ["Broadmeadows","3047","Hume","middle"],["Tullamarine","3043","Hume","middle"],
  ["Gladstone Park","3043","Hume","middle"],["Glenroy","3046","Moreland","middle"],
  ["Pascoe Vale","3044","Moreland","middle"],["Fawkner","3060","Moreland","middle"],
  ["Lalor","3075","Whittlesea","middle"],["Thomastown","3074","Whittlesea","middle"],
  ["Bundoora","3083","Banyule","middle"],["Greensborough","3088","Banyule","middle"],
  ["Heidelberg","3084","Banyule","middle"],["Ivanhoe","3079","Banyule","middle"],
  ["Templestowe","3106","Manningham","middle"],["Doncaster","3108","Manningham","middle"],
  ["Doncaster East","3109","Manningham","middle"],["Glen Waverley","3150","Monash","middle"],
  ["Mount Waverley","3149","Monash","middle"],["Oakleigh","3166","Monash","middle"],
  ["Clayton","3168","Monash","middle"],["Springvale","3171","Greater Dandenong","middle"],
  ["Noble Park","3174","Greater Dandenong","middle"],["Sandringham","3191","Bayside","middle"],
  ["Hampton","3188","Bayside","middle"],["Brighton","3186","Bayside","middle"],
  ["Brighton East","3187","Bayside","middle"],["Beaumaris","3193","Bayside","middle"],
  ["Cheltenham","3192","Kingston","middle"],["Mentone","3194","Kingston","middle"],
  ["Parkdale","3195","Kingston","middle"],["Mordialloc","3195","Kingston","middle"],
  ["Bentleigh","3204","Glen Eira","middle"],["Bentleigh East","3165","Glen Eira","middle"],
  ["Carnegie","3163","Glen Eira","middle"],["Box Hill","3128","Whitehorse","middle"],
  ["Blackburn","3130","Whitehorse","middle"],["Nunawading","3131","Whitehorse","middle"],
  ["Mitcham","3132","Whitehorse","middle"],["Vermont","3133","Whitehorse","middle"],
  ["Surrey Hills","3127","Boroondara","middle"],["Balwyn","3103","Boroondara","middle"],
  ["Balwyn North","3104","Boroondara","middle"],
  ["Craigieburn","3064","Hume","outer"],["Roxburgh Park","3064","Hume","outer"],
  ["Epping","3076","Whittlesea","outer"],["South Morang","3752","Whittlesea","outer"],
  ["Mill Park","3082","Whittlesea","outer"],["Doreen","3754","Whittlesea","outer"],
  ["Mernda","3754","Whittlesea","outer"],["Wollert","3750","Whittlesea","outer"],
  ["Eltham","3095","Nillumbik","outer"],["Diamond Creek","3089","Nillumbik","outer"],
  ["Ringwood","3134","Maroondah","outer"],["Croydon","3136","Maroondah","outer"],
  ["Bayswater","3153","Knox","outer"],["Boronia","3155","Knox","outer"],
  ["Wantirna","3152","Knox","outer"],["Ferntree Gully","3156","Knox","outer"],
  ["Rowville","3178","Knox","outer"],["Dandenong","3175","Greater Dandenong","outer"],
  ["Keysborough","3173","Greater Dandenong","outer"],["Endeavour Hills","3802","Casey","outer"],
  ["Narre Warren","3805","Casey","outer"],["Berwick","3806","Casey","outer"],
  ["Cranbourne","3977","Casey","outer"],["Hampton Park","3976","Casey","outer"],
  ["Hallam","3803","Casey","outer"],["Carrum Downs","3201","Frankston","outer"],
  ["Frankston","3199","Frankston","outer"],["Seaford","3198","Frankston","outer"],
  ["Chelsea","3196","Kingston","outer"],["Carrum","3197","Kingston","outer"],
  ["Warrandyte","3113","Manningham","outer"],["Sunbury","3429","Hume","outer"],
  ["Melton","3337","Melton","outer"],["Melton South","3338","Melton","outer"],
  ["Hoppers Crossing","3029","Wyndham","outer"],["Werribee","3030","Wyndham","outer"],
  ["Point Cook","3030","Wyndham","outer"],["Tarneit","3029","Wyndham","outer"],
  ["Truganina","3029","Wyndham","outer"],["Wyndham Vale","3024","Wyndham","outer"],
  ["Williams Landing","3027","Wyndham","outer"],["Keilor","3036","Brimbank","outer"],
  ["Taylors Lakes","3038","Brimbank","outer"],["Sydenham","3037","Brimbank","outer"],
];

const batchSize = 25;
for (let i = 0; i < suburbs.length; i += batchSize) {
  const batch = suburbs.slice(i, i + batchSize);
  await connection.execute(
    `INSERT IGNORE INTO suburbs (name, postcode, lga, zone, isActive) VALUES ${batch.map(() => "(?,?,?,?,1)").join(",")}`,
    batch.flatMap(s => s)
  );
}
console.log(`Seeded ${suburbs.length} suburbs`);

await connection.end();
console.log("Done.");
