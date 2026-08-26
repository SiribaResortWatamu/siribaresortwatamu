-- =====================================================================
-- Siriba Resort Watamu — Demo content
--
-- Safe to run more than once. Everything here is ordinary CMS content:
-- the owner can edit or archive all of it from the admin dashboard.
-- Photo paths are absolute URLs so the demo looks right before any
-- upload has happened; uploaded media is stored as a `media/...` key
-- and both forms are resolved by `resolveImage()` in the app.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Property details
-- ---------------------------------------------------------------------
update site_settings set
  property_name       = 'Siriba Resort Watamu',
  tagline             = 'Your Coastal Escape Starts Here',
  address             = 'Neverland Junction, Jacaranda Road, Watamu, Kenya',
  phone               = '+254 723 862 921',
  whatsapp            = '254723862921',
  email               = 'info@siribaresortwatamu.com',
  owner_email         = 'info@siribaresortwatamu.com',
  facebook_url        = 'https://web.facebook.com/profile.php?id=61572056341645',
  instagram_url       = 'https://www.instagram.com/siribaresortwatamu/',
  map_embed_url       = 'https://www.google.com/maps?q=Siriba+Resort+Watamu&output=embed',
  check_in_time       = '14:00',
  check_out_time      = '10:00',
  hold_duration_hours = 3,
  booking_terms       = 'A deposit confirms your dates. The balance is settled on arrival. Rates are per apartment, per night.',
  cancellation_policy = 'Free cancellation up to 14 days before arrival. Within 14 days the deposit is non-refundable.',
  arrival_information = 'We are at Neverland Junction on Jacaranda Road, minutes from Watamu Marine National Park. Send us your arrival time and we will meet you at the gate.'
where id;

-- ---------------------------------------------------------------------
-- Amenities
-- ---------------------------------------------------------------------
insert into amenities (name, icon, description, display_order, is_featured) values
  ('Swimming Pool',        'waves',       'Freshwater pool shaded by palms',            10, true),
  ('Beach Access',         'palmtree',    'Five minutes on foot to the white sand',     20, true),
  ('Free Wi-Fi',           'wifi',        'Fibre throughout the property',              30, true),
  ('Air Conditioning',     'wind',        'In every bedroom',                           40, true),
  ('Fully Fitted Kitchen', 'chef-hat',    'Cook your own or ask our chef',              50, true),
  ('Secure Parking',       'car',         'Gated off-street parking',                   60, true),
  ('24/7 Security',        'shield-check','Manned gate, day and night',                 70, true),
  ('Daily Housekeeping',   'sparkles',    'Rooms serviced every morning',               80, true),
  ('Garden Terrace',       'trees',       'Shaded outdoor seating',                     90, false),
  ('Airport Transfers',    'plane',       'Arranged on request',                       100, false),
  ('Backup Generator',     'zap',         'No interruption to your stay',              110, false),
  ('Laundry Service',      'shirt',       'Same-day laundry',                          120, false),
  ('Safari Desk',          'binoculars',  'Plan your Tsavo or Mara trip with us',      130, false),
  ('BBQ Area',             'flame',       'Charcoal grill by the pool',                140, false)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- Accommodation
-- ---------------------------------------------------------------------
insert into apartments (
  name, slug, short_description, full_description, property_type, location,
  max_guests, bedrooms, bathrooms, beds, nightly_rate, currency, min_nights,
  cleaning_fee, deposit_percent, status, display_order, is_featured,
  seo_title, seo_description, amenity_ids
) values
(
  'Ocean View Apartment', 'ocean-view-apartment',
  'A bright two-bedroom apartment with an open terrace facing the Indian Ocean.',
  E'Wake to the sound of the reef. The Ocean View Apartment occupies the upper floor of the main house, with a wide terrace that catches the sea breeze from mid-morning onwards.\n\nThe living space opens straight onto the terrace, so the doors tend to stay open all day. Both bedrooms are air-conditioned and fitted with mosquito nets, and the kitchen is equipped for cooking properly rather than just making coffee.\n\nIt suits a family or two couples travelling together, and it is a short, shaded walk down to the beach.',
  'Apartment', 'Jacaranda Road, Watamu',
  4, 2, 2, 3, 12500, 'KES', 2, 2000, 30, 'published', 10, true,
  'Ocean View Apartment — Siriba Resort Watamu',
  'Two-bedroom ocean-facing apartment in Watamu with a private terrace, air conditioning and a five-minute walk to the beach.',
  (select coalesce(array_agg(id), '{}') from amenities
    where name in ('Swimming Pool','Beach Access','Free Wi-Fi','Air Conditioning',
                   'Fully Fitted Kitchen','Secure Parking','Daily Housekeeping','Garden Terrace'))
),
(
  'Garden Apartment', 'garden-apartment',
  'A quiet ground-floor apartment opening onto the tropical garden and pool.',
  E'The Garden Apartment sits at the cool, shaded end of the property, a few steps from the pool. Frangipani and bougainvillea grow right up to the veranda, and the birdlife in the early morning is remarkable.\n\nInside there is one generous bedroom, a large living area with a sofa bed, and a kitchen that opens onto a private veranda for breakfast.\n\nIt is our most popular choice for couples and for guests staying a week or more.',
  'Apartment', 'Jacaranda Road, Watamu',
  3, 1, 1, 2, 8500, 'KES', 2, 1500, 30, 'published', 20, true,
  'Garden Apartment — Siriba Resort Watamu',
  'One-bedroom garden apartment beside the pool at Siriba Resort Watamu, with private veranda and fitted kitchen.',
  (select coalesce(array_agg(id), '{}') from amenities
    where name in ('Swimming Pool','Beach Access','Free Wi-Fi','Air Conditioning',
                   'Fully Fitted Kitchen','Secure Parking','Garden Terrace','BBQ Area'))
),
(
  'Palm Suite', 'palm-suite',
  'A spacious three-bedroom suite for families and groups, with its own lounge.',
  E'The Palm Suite takes up the whole west wing. Three bedrooms, each with its own bathroom, arranged around a private lounge and dining room.\n\nThe layout works well for two families sharing, or for a group who want to eat together but sleep apart. The kitchen is full-sized and there is a laundry point in the utility room.\n\nA cot and high chair are available at no charge — just ask when you book.',
  'Suite', 'Jacaranda Road, Watamu',
  6, 3, 3, 4, 19500, 'KES', 3, 3000, 30, 'published', 30, true,
  'Palm Suite — Siriba Resort Watamu',
  'Three-bedroom family suite in Watamu with private lounge, three bathrooms and full kitchen. Sleeps six.',
  (select coalesce(array_agg(id), '{}') from amenities
    where name in ('Swimming Pool','Beach Access','Free Wi-Fi','Air Conditioning',
                   'Fully Fitted Kitchen','Secure Parking','24/7 Security',
                   'Daily Housekeeping','Laundry Service','Backup Generator'))
),
(
  'Coral Studio', 'coral-studio',
  'A compact, well-priced studio for solo travellers and couples on short stays.',
  E'A simple, comfortable studio with a queen bed, a kitchenette and a shaded seat outside the door.\n\nIt is the right choice if you plan to spend your days out on the water or on the road and want somewhere clean and quiet to come back to.',
  'Studio', 'Jacaranda Road, Watamu',
  2, 1, 1, 1, 5500, 'KES', 1, 1000, 25, 'published', 40, false,
  'Coral Studio — Siriba Resort Watamu',
  'Affordable studio accommodation in Watamu with kitchenette, air conditioning and pool access.',
  (select coalesce(array_agg(id), '{}') from amenities
    where name in ('Swimming Pool','Beach Access','Free Wi-Fi','Air Conditioning','Secure Parking'))
)
on conflict (slug) do nothing;

insert into apartment_photos (apartment_id, storage_path, alt_text, display_order, is_cover)
select a.id, p.path, p.alt, p.ord, p.cover
from apartments a
join (values
  ('ocean-view-apartment','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80','Ocean View Apartment terrace',0,true),
  ('ocean-view-apartment','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80','Living area',1,false),
  ('ocean-view-apartment','https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80','Main bedroom',2,false),
  ('ocean-view-apartment','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1600&q=80','Bathroom',3,false),
  ('garden-apartment','https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1600&q=80','Garden Apartment veranda',0,true),
  ('garden-apartment','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=80','Bedroom',1,false),
  ('garden-apartment','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80','Kitchen and dining',2,false),
  ('palm-suite','https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=80','Palm Suite lounge',0,true),
  ('palm-suite','https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&q=80','Second bedroom',1,false),
  ('palm-suite','https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1600&q=80','Dining room',2,false),
  ('coral-studio','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80','Coral Studio',0,true),
  ('coral-studio','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600&q=80','Studio bed',1,false)
) as p(slug, path, alt, ord, cover) on p.slug = a.slug
where not exists (select 1 from apartment_photos ap where ap.apartment_id = a.id);

-- ---------------------------------------------------------------------
-- Safaris
-- ---------------------------------------------------------------------
insert into safari_packages (
  name, slug, short_description, full_description, destination, duration, duration_days,
  starting_location, ending_location, safari_type, price, currency, price_display_mode,
  highlights, included, excluded, optional_extras, important_info,
  status, display_order, is_featured, seo_title, seo_description
) values
(
  'Tsavo East Two-Day Safari', 'tsavo-east-two-day-safari',
  'The classic coastal safari — red elephants, Aruba Dam and a night in the park.',
  E'Tsavo East is the nearest big-game park to Watamu and the easiest safari to fit into a beach holiday. Two days is enough to see it properly without a long drive.\n\nWe leave Watamu early, enter the park at Sala Gate and game drive our way west towards the Voi River circuit — the most reliable stretch for elephant, lion and buffalo. Tsavo elephants take on the colour of the red volcanic soil they dust themselves with, which is what gives them their name.\n\nAfter a night in the park you are out at first light for the best game viewing of the trip, then back to the coast in the afternoon.',
  'Tsavo East National Park', '2 days / 1 night', 2,
  'Watamu', 'Watamu', 'Group Safari', 385, 'USD', 'from_price',
  array['Tsavo''s famous red elephants','Aruba Dam at sunset','Sunrise game drive on the Voi River circuit','Full-board lodge accommodation inside the park','Pick-up and drop-off at your Watamu accommodation'],
  array['Park entry fees','Transport in a 4x4 safari minivan with pop-up roof','Professional English-speaking driver-guide','Full-board accommodation (1 night)','Drinking water during game drives','Pick-up and drop-off in Watamu'],
  array['International and domestic flights','Visas','Travel insurance','Alcoholic drinks','Tips and items of a personal nature','Optional balloon safari'],
  array['Private vehicle upgrade','Single room supplement','Extra night in the park','Professional photographer'],
  E'Bring a hat, sunscreen, binoculars and something warm for the early morning drive. Departures are daily, subject to a minimum of two travellers. Children under 12 travel at a reduced park rate.',
  'published', 10, true,
  'Tsavo East 2-Day Safari from Watamu — Siriba Resort',
  'Two-day Tsavo East safari departing from Watamu. Red elephants, Aruba Dam and a sunrise game drive, with full-board lodge accommodation.'
),
(
  'Masai Mara Fly-In Safari', 'masai-mara-fly-in-safari',
  'Fly from the coast to Kenya''s greatest reserve for three days in the Mara.',
  E'The Masai Mara is a long way from Watamu by road, so we fly. A short hop via Nairobi puts you on a Mara airstrip by lunchtime on the first day, and you are game driving the same afternoon.\n\nThree days gives you time to cover the Mara Triangle and the Talek river crossings, and — between July and October — a real chance at the wildebeest migration. Big cats are seen year-round.\n\nYou stay in a tented camp on the reserve boundary, close enough for early starts and quiet enough to hear hyena at night.',
  'Masai Mara National Reserve', '3 days / 2 nights', 3,
  'Malindi Airport', 'Malindi Airport', 'Fly-In Safari', 1450, 'USD', 'from_price',
  array['Return flights from the coast','Big cats year-round','Wildebeest migration crossings in season','Tented camp on the reserve boundary','Optional visit to a Maasai village'],
  array['Return domestic flights','All park and reserve fees','Game drives in a 4x4 land cruiser','Full-board tented camp accommodation','Airport transfers at both ends','Drinking water'],
  array['International flights','Visas','Travel insurance','Balloon safari','Maasai village entry fee','Tips and personal items'],
  array['Hot-air balloon safari over the Mara','Private land cruiser','Extra night in camp','Maasai village visit'],
  E'Domestic flights carry a 15 kg soft-bag luggage limit. Excess luggage can be stored at your Watamu accommodation at no cost. Migration timing varies year to year and cannot be guaranteed.',
  'published', 20, true,
  'Masai Mara Fly-In Safari from Watamu — Siriba Resort',
  'Three-day fly-in Masai Mara safari from the Kenyan coast. Big cats, migration crossings in season and full-board tented camp accommodation.'
),
(
  'Mida Creek & Gede Ruins Day Trip', 'mida-creek-gede-ruins-day-trip',
  'A half-day on your doorstep — mangrove boardwalk, dhow sunset and a lost Swahili town.',
  E'You do not have to leave Watamu to see something remarkable. This trip pairs the Gede Ruins — a 12th-century Swahili town swallowed by the forest and only rediscovered in the 1920s — with Mida Creek, a mangrove system that fills and empties with the tide.\n\nAt Gede you walk among coral-rag walls, a mosque and a palace under enormous baobab and tamarind trees. At Mida you cross the boardwalk out over the mangroves and, if the tide is right, take a dhow out for sunset.\n\nIt is an easy afternoon and works well on an arrival or departure day.',
  'Gede & Mida Creek, Watamu', 'Half day', 1,
  'Watamu', 'Watamu', 'Day Trip', 65, 'USD', 'from_price',
  array['12th-century Gede Ruins','Mida Creek mangrove boardwalk','Sunset dhow ride (tide permitting)','Excellent birdwatching','Back in time for dinner'],
  array['Transport from your accommodation','Guide','Gede Ruins entry fee','Mida Creek boardwalk fee','Bottled water'],
  array['Dhow hire if the tide does not allow','Drinks and snacks','Tips'],
  array['Private guide','Seafood platter at the creek','Extended birdwatching start'],
  E'Departure time shifts with the tide, so we confirm your pick-up the day before. Wear shoes you can walk in — the ruins are uneven underfoot.',
  'published', 30, false,
  'Gede Ruins & Mida Creek Day Trip — Siriba Resort Watamu',
  'Half-day trip from Watamu to the Gede Ruins and Mida Creek, with mangrove boardwalk and sunset dhow ride.'
)
on conflict (slug) do nothing;

insert into safari_photos (safari_id, storage_path, alt_text, display_order, is_cover)
select s.id, p.path, p.alt, p.ord, p.cover
from safari_packages s
join (values
  ('tsavo-east-two-day-safari','https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80','Elephants in Tsavo',0,true),
  ('tsavo-east-two-day-safari','https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80','Safari vehicle at sunset',1,false),
  ('masai-mara-fly-in-safari','https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=1600&q=80','Lion in the Masai Mara',0,true),
  ('masai-mara-fly-in-safari','https://images.unsplash.com/photo-1509219773433-fc3ff2d67c00?w=1600&q=80','Wildebeest migration',1,false),
  ('mida-creek-gede-ruins-day-trip','https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=1600&q=80','Mangroves at Mida Creek',0,true)
) as p(slug, path, alt, ord, cover) on p.slug = s.slug
where not exists (select 1 from safari_photos sp where sp.safari_id = s.id);

insert into safari_itinerary_days (safari_id, day_number, title, description, activities, accommodation, meals, display_order)
select s.id, d.num, d.title, d.descr, d.acts, d.accom, d.meals, d.num
from safari_packages s
join (values
  ('tsavo-east-two-day-safari', 1, 'Watamu to Tsavo East — Afternoon Game Drive',
   'Pick-up from your accommodation at 06:00 and drive inland via Malindi. We enter Tsavo East at Sala Gate mid-morning and game drive along the Galana River towards the Voi area, arriving at the lodge for lunch. The afternoon drive takes in Aruba Dam, where elephant and buffalo come down to drink as the light softens.',
   array['Scenic drive from the coast','Game drive along the Galana River','Aruba Dam at sunset','Lukenya rock viewpoint'],
   'Ashnil Aruba Lodge or similar', 'Lunch, dinner', 1),
  ('tsavo-east-two-day-safari', 2, 'Sunrise Game Drive and Return to Watamu',
   'Out of camp at first light for the best game viewing of the trip — predators are still active and the light is at its best for photography. Back to the lodge for a full breakfast, then a final drive out through the park and on to the coast, arriving in Watamu mid to late afternoon.',
   array['Sunrise game drive','Big cat tracking','Breakfast at the lodge','Return transfer to Watamu'],
   'n/a — return to Watamu', 'Breakfast, lunch', 2),

  ('masai-mara-fly-in-safari', 1, 'Fly to the Mara — Afternoon Game Drive',
   'Transfer to Malindi Airport for the morning flight via Nairobi. You land on a Mara airstrip around midday and are met by your driver-guide, with a game drive on the way to camp. After lunch and time to settle in, the afternoon drive heads for the plains where the big cats hunt.',
   array['Flight from the coast','Airstrip pick-up and transfer game drive','Afternoon game drive'],
   'Mara tented camp', 'Lunch, dinner', 1),
  ('masai-mara-fly-in-safari', 2, 'Full Day in the Reserve',
   'A full day in the Mara with a picnic lunch, so you can push deep into the reserve rather than returning to camp at midday. Between July and October we spend time along the Mara River where the migration herds cross. Outside that window we work the Mara Triangle and the Talek, which hold resident game year-round.',
   array['Dawn departure with picnic lunch','Mara River crossing points in season','Mara Triangle game drive','Optional Maasai village visit'],
   'Mara tented camp', 'Breakfast, picnic lunch, dinner', 2),
  ('masai-mara-fly-in-safari', 3, 'Morning Drive and Flight Home',
   'A final early drive before breakfast, then back to camp to pack. Transfer to the airstrip for the flight to the coast, connecting via Nairobi, and a road transfer from Malindi Airport back to your accommodation in Watamu.',
   array['Sunrise game drive','Transfer to airstrip','Flight to the coast','Road transfer to Watamu'],
   'n/a — return to Watamu', 'Breakfast', 3),

  ('mida-creek-gede-ruins-day-trip', 1, 'Gede Ruins and Mida Creek at Sunset',
   'Afternoon pick-up from your accommodation. We start at the Gede Ruins, walking the site with a guide for about ninety minutes — the mosque, the palace and the pillar tombs, under some of the largest baobabs on the coast. From there it is a short drive to Mida Creek for the mangrove boardwalk, and if the tide allows, a dhow out onto the water for sunset before the drive home.',
   array['Guided walk at the Gede Ruins','Mida Creek mangrove boardwalk','Sunset dhow ride (tide permitting)','Birdwatching at the creek'],
   'n/a — day trip', 'Bottled water included', 1)
) as d(slug, num, title, descr, acts, accom, meals) on d.slug = s.slug
where not exists (select 1 from safari_itinerary_days i where i.safari_id = s.id);

-- ---------------------------------------------------------------------
-- Transfers
-- ---------------------------------------------------------------------
insert into transfer_services (
  name, slug, short_description, full_description, service_type,
  pickup_locations, dropoff_locations, vehicle_type, passenger_capacity,
  luggage_capacity, journey_time, pricing_method, price, currency,
  included, excluded, additional_charges,
  status, display_order, is_featured, seo_title, seo_description
) values
(
  'Malindi Airport Transfer', 'malindi-airport-transfer',
  'Private transfer between Malindi Airport and Watamu, met at arrivals.',
  E'Malindi Airport is the closest airport to Watamu — around forty minutes door to door. Your driver waits in arrivals with a name board and helps with luggage.\n\nWe track your flight, so a delay costs you nothing and there is no need to call ahead. The vehicle is air-conditioned and drinking water is provided.',
  'Airport Transfer',
  array['Malindi Airport (MYD)','Watamu accommodation'],
  array['Watamu accommodation','Malindi Airport (MYD)'],
  'Air-conditioned saloon or minivan', 4, 4, '40 minutes', 'fixed', 4500, 'KES',
  array['Meet and greet at arrivals','Flight tracking','Air-conditioned vehicle','Bottled water','All fuel and tolls','60 minutes free waiting time'],
  array['Gratuities','Child seat unless requested'],
  array['Waiting beyond 60 minutes: KES 500 per 30 minutes','Night surcharge 22:00–05:00: KES 1,000','Child seat: KES 500'],
  'published', 10, true,
  'Malindi Airport Transfer to Watamu — Siriba Resort',
  'Private airport transfer between Malindi Airport and Watamu. Meet and greet, flight tracking and a fixed price of KES 4,500.'
),
(
  'Mombasa Airport Transfer', 'mombasa-airport-transfer',
  'Door-to-door private transfer between Moi International Airport and Watamu.',
  E'Moi International Airport in Mombasa handles most international arrivals to the coast. The drive to Watamu takes around two hours depending on the Mtwapa and Kilifi crossings.\n\nWe use a full-size air-conditioned vehicle for this route and build a comfort stop into the journey.',
  'Airport Transfer',
  array['Moi International Airport (MBA)','Watamu accommodation'],
  array['Watamu accommodation','Moi International Airport (MBA)'],
  'Air-conditioned minivan', 6, 6, '2 hours', 'fixed', 12000, 'KES',
  array['Meet and greet at arrivals','Flight tracking','Air-conditioned vehicle','Bottled water','Comfort stop en route','All fuel and tolls','90 minutes free waiting time'],
  array['Gratuities','Meals during the journey'],
  array['Night surcharge 22:00–05:00: KES 1,500','Additional stop: KES 1,000','Child seat: KES 500'],
  'published', 20, true,
  'Mombasa Airport Transfer to Watamu — Siriba Resort',
  'Private transfer between Moi International Airport Mombasa and Watamu. Air-conditioned vehicle, fixed price, flight tracking.'
),
(
  'SGR Station Transfer', 'sgr-station-transfer',
  'Meet the Madaraka Express at Mombasa Terminus and travel straight to Watamu.',
  E'The SGR from Nairobi arrives at Mombasa Terminus, about two and a half hours from Watamu. We time the pick-up to the train rather than the clock, so a late train is not your problem.\n\nYour driver meets you on the concourse with a name board.',
  'SGR Transfer',
  array['Mombasa SGR Terminus','Watamu accommodation'],
  array['Watamu accommodation','Mombasa SGR Terminus'],
  'Air-conditioned minivan', 6, 6, '2 hours 30 minutes', 'fixed', 13000, 'KES',
  array['Meet and greet on the concourse','Train schedule tracking','Air-conditioned vehicle','Bottled water','All fuel and tolls'],
  array['Train tickets','Gratuities'],
  array['Night surcharge 22:00–05:00: KES 1,500','Additional stop: KES 1,000'],
  'published', 30, true,
  'SGR Mombasa Terminus Transfer to Watamu — Siriba Resort',
  'Private transfer from Mombasa SGR Terminus to Watamu, timed to the Madaraka Express arrival.'
),
(
  'Watamu Local Taxi', 'watamu-local-taxi',
  'Short hops around Watamu, Turtle Bay and Gede — priced per trip.',
  E'For getting to dinner, the marine park gate, the Gede Ruins or the shops in Watamu village. Call or WhatsApp and we will usually have someone with you inside fifteen minutes.\n\nFares are fixed by zone, so there is nothing to negotiate at the end of the ride.',
  'Local Taxi',
  array['Anywhere in Watamu'],
  array['Watamu village','Turtle Bay','Gede','Mida Creek','Local restaurants'],
  'Saloon car', 4, 2, '5–20 minutes', 'fixed', 800, 'KES',
  array['Fixed fare, no negotiation','Air-conditioned vehicle','Vetted local driver'],
  array['Waiting time','Trips beyond the Watamu area'],
  array['Waiting time: KES 300 per 30 minutes','Late-night pick-up after 23:00: KES 300'],
  'published', 40, false,
  'Watamu Local Taxi — Siriba Resort',
  'Reliable local taxi service in Watamu with fixed zone fares and vetted drivers.'
),
(
  'Full-Day Private Driver', 'full-day-private-driver',
  'A vehicle and driver for the whole day, wherever you want to go.',
  E'Take the coast at your own pace. The vehicle and driver are yours for ten hours, so you can string together Gede, Mida Creek, Malindi town and lunch somewhere on the water without watching the clock.\n\nYour driver knows the area well and is happy to suggest a route, or to simply take you where you ask.',
  'Private Driver',
  array['Your Watamu accommodation'],
  array['Anywhere on the north coast'],
  'Air-conditioned minivan', 6, 4, 'Up to 10 hours', 'fixed', 15000, 'KES',
  array['Driver for up to 10 hours','Air-conditioned vehicle','Fuel within the north coast area','Bottled water','Driver''s meals'],
  array['Entry fees to attractions','Your own meals','Gratuities'],
  array['Each additional hour: KES 1,500','Travel beyond Kilifi or Malindi: KES 60 per km'],
  'published', 50, true,
  'Full-Day Private Driver in Watamu — Siriba Resort',
  'Hire a private driver and air-conditioned vehicle for a full day on the Kenyan north coast from Watamu.'
),
(
  'Diani & South Coast Transfer', 'diani-south-coast-transfer',
  'Long-distance transfer to Diani and the south coast, including the Likoni crossing.',
  E'The run down to Diani takes in the Likoni ferry crossing, which is best done with a driver who knows the queues. Around four hours in total from Watamu.\n\nWe use a comfortable full-size vehicle and build in a stop.',
  'Hotel Transfer',
  array['Watamu accommodation'],
  array['Diani Beach','Ukunda Airstrip','South coast hotels'],
  'Air-conditioned minivan', 6, 6, '4 hours', 'fixed', 22000, 'KES',
  array['Air-conditioned vehicle','Ferry charges','Comfort stop','Bottled water','All fuel and tolls'],
  array['Meals','Gratuities'],
  array['Night surcharge 22:00–05:00: KES 2,000','Additional stop: KES 1,500'],
  'published', 60, false,
  'Watamu to Diani Transfer — Siriba Resort',
  'Private transfer from Watamu to Diani and the south coast, including the Likoni ferry crossing.'
),
(
  'Excursion Transfer', 'excursion-transfer',
  'Transport to Arabuko Sokoke, Malindi Marine Park or wherever you are headed.',
  E'If you have booked an excursion directly and only need the transport, we will get you there and back. Tell us where and when, and we will quote by distance.\n\nCommon runs include Arabuko Sokoke Forest, Malindi Marine National Park, Che Shale and the Kilifi creek.',
  'Excursion Transfer',
  array['Your Watamu accommodation'],
  array['Arabuko Sokoke Forest','Malindi Marine Park','Kilifi','Che Shale','Custom destination'],
  'Air-conditioned saloon or minivan', 6, 4, 'Varies', 'on_enquiry', 0, 'KES',
  array['Air-conditioned vehicle','Return journey','Waiting time at the destination','Bottled water'],
  array['Entry and activity fees','Meals','Gratuities'],
  array['Quoted per journey based on distance and waiting time'],
  'published', 70, false,
  'Excursion Transfers from Watamu — Siriba Resort',
  'Private excursion transport from Watamu to Arabuko Sokoke, Malindi Marine Park, Kilifi and custom destinations.'
)
on conflict (slug) do nothing;

insert into transfer_photos (transfer_id, storage_path, alt_text, display_order, is_cover)
select t.id, p.path, p.alt, 0, true
from transfer_services t
join (values
  ('malindi-airport-transfer','https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80','Aircraft at Malindi Airport'),
  ('mombasa-airport-transfer','https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1600&q=80','Airport transfer vehicle'),
  ('sgr-station-transfer','https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1600&q=80','Train at the station'),
  ('watamu-local-taxi','https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1600&q=80','Taxi on a coastal road'),
  ('full-day-private-driver','https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1600&q=80','Private driver and vehicle'),
  ('diani-south-coast-transfer','https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=1600&q=80','Coastal road to the south coast'),
  ('excursion-transfer','https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600&q=80','Excursion vehicle in the forest')
) as p(slug, path, alt) on p.slug = t.slug
where not exists (select 1 from transfer_photos tp where tp.transfer_id = t.id);

-- ---------------------------------------------------------------------
-- Fleet
-- ---------------------------------------------------------------------
insert into vehicles (name, registration, vehicle_type, capacity, luggage_capacity, status) values
  ('Toyota Noah — White',      'KDA 123A', 'Minivan',       6, 6, 'active'),
  ('Toyota Fielder — Silver',  'KCB 456B', 'Saloon',        4, 2, 'active'),
  ('Toyota Hiace — White',     'KDC 789C', 'Minibus',      11, 8, 'active'),
  ('Land Cruiser — Safari',    'KBZ 321Z', 'Safari 4x4',    7, 7, 'active')
on conflict (registration) do nothing;

insert into drivers (name, phone, whatsapp, licence_no, vehicle_id, status, notes)
select d.name, d.phone, d.wa, d.lic, v.id, 'active', d.note
from (values
  ('Juma Mwangi',  '+254 711 111 111', '254711111111', 'DL-114523', 'KDA 123A', 'Airport runs and long-distance transfers.'),
  ('Ali Salim',    '+254 722 222 222', '254722222222', 'DL-227781', 'KCB 456B', 'Local Watamu taxi, knows every back road.'),
  ('Peter Kariuki','+254 733 333 333', '254733333333', 'DL-330912', 'KDC 789C', 'Group transfers and SGR runs.'),
  ('Hassan Omar',  '+254 744 444 444', '254744444444', 'DL-441256', 'KBZ 321Z', 'Safari driver-guide, Tsavo and Amboseli.')
) as d(name, phone, wa, lic, reg, note)
left join vehicles v on v.registration = d.reg
where not exists (select 1 from drivers dr where dr.phone = d.phone);
