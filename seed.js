/* Seed the Postgres DB with the original SERIES data from index.html.
   Idempotent: skips seeding if the DB already has any series.
   Force re-seed:  node seed.js --force                                       */

require('dotenv').config();
const db = require('./db');

const FORCE = process.argv.includes('--force');

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});

async function main() {

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME';
const T = 'q_auto,f_auto';
const cld = (id) => `https://res.cloudinary.com/${CLOUD}/image/upload/${T}/${id}`;

const SERIES = [
  {
    num: 'Series 01', name: 'Yogyakarta 1', year: '2024',
    cover: cld('yogyakarta-1/cover'),
    desc: 'Old sultanate temples, misty volcanoes, and the gentle chaos of Malioboro — Yogyakarta in quiet frames.',
    photos: [
      { title: 'Prambanan at Dusk',    img: cld('yogyakarta-1/prambanan-dusk'),  cam: 'Sony A7C', lens: '35mm f/1.8', iso: '400',  ss: '1/320s',  ap: 'f/2.0' },
      { title: 'Malioboro Street',     img: cld('yogyakarta-1/malioboro-street'),cam: 'Sony A7C', lens: '50mm f/1.4', iso: '800',  ss: '1/60s',   ap: 'f/1.8' },
      { title: 'Borobudur Morning',    img: cld('yogyakarta-1/borobudur-morning'),cam: 'Sony A7C', lens: '16mm f/2.8', iso: '100',  ss: '1/500s',  ap: 'f/5.6' },
      { title: 'Warung Kopi',          img: cld('yogyakarta-1/warung-kopi'),     cam: 'Sony A7C', lens: '35mm f/1.8', iso: '1600', ss: '1/80s',   ap: 'f/1.8' },
      { title: 'Kraton Gate',          img: cld('yogyakarta-1/kraton-gate'),     cam: 'Sony A7C', lens: '50mm f/1.4', iso: '200',  ss: '1/250s',  ap: 'f/2.8' },
      { title: 'Alun-Alun Kidul',      img: cld('yogyakarta-1/alun-alun-kidul'), cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/1000s', ap: 'f/8'   },
      { title: 'Sunset over Merapi',   img: cld('yogyakarta-1/sunset-merapi'),   cam: 'Sony A7C', lens: '85mm f/1.8', iso: '100',  ss: '1/640s',  ap: 'f/4'   },
      { title: 'Old Town Alley',       img: cld('yogyakarta-1/old-town-alley'),  cam: 'Sony A7C', lens: '35mm f/1.8', iso: '3200', ss: '1/50s',   ap: 'f/1.8' },
      { title: 'Tugu Monument',        img: cld('yogyakarta-1/tugu-monument'),   cam: 'Sony A7C', lens: '24mm f/2.8', iso: '200',  ss: '1/400s',  ap: 'f/5.6' },
      { title: 'Beringharjo Market',   img: cld('yogyakarta-1/beringharjo'),     cam: 'Sony A7C', lens: '35mm f/1.8', iso: '800',  ss: '1/80s',   ap: 'f/2.0' },
      { title: 'Kaliurang Road',       img: cld('yogyakarta-1/kaliurang'),       cam: 'Sony A7C', lens: '50mm f/1.4', iso: '200',  ss: '1/500s',  ap: 'f/2.8' },
      { title: 'Parangtritis',         img: cld('yogyakarta-1/parangtritis'),    cam: 'Sony A7C', lens: '16mm f/2.8', iso: '100',  ss: '1/1000s', ap: 'f/8'   },
      { title: 'Prawirotaman',         img: cld('yogyakarta-1/prawirotaman'),    cam: 'Sony A7C', lens: '35mm f/1.8', iso: '640',  ss: '1/100s',  ap: 'f/2.0' },
      { title: 'Kotagede Silver',      img: cld('yogyakarta-1/kotagede'),        cam: 'Sony A7C', lens: '85mm f/1.8', iso: '400',  ss: '1/200s',  ap: 'f/3.5' },
      { title: 'Selokan Mataram',      img: cld('yogyakarta-1/selokan-mataram'), cam: 'Sony A7C', lens: '50mm f/1.4', iso: '200',  ss: '1/800s',  ap: 'f/4'   },
      { title: 'Plengkung Gading',     img: cld('yogyakarta-1/plengkung-gading'),cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/500s',  ap: 'f/5.6' },
      { title: 'Mie Ayam Pak Slamet',  img: cld('yogyakarta-1/mie-ayam'),        cam: 'Sony A7C', lens: '35mm f/1.8', iso: '1600', ss: '1/60s',   ap: 'f/1.8' },
      { title: 'Batik Workshop',       img: cld('yogyakarta-1/batik-workshop'),  cam: 'Sony A7C', lens: '50mm f/1.4', iso: '800',  ss: '1/80s',   ap: 'f/2.0' },
      { title: 'Puncak Suroloyo',      img: cld('yogyakarta-1/suroloyo'),        cam: 'Sony A7C', lens: '16mm f/2.8', iso: '100',  ss: '1/640s',  ap: 'f/6.3' },
      { title: 'Kasongan Pottery',     img: cld('yogyakarta-1/kasongan'),        cam: 'Sony A7C', lens: '35mm f/1.8', iso: '400',  ss: '1/250s',  ap: 'f/2.8' },
    ],
  },
  {
    num: 'Series 02', name: 'Yogyakarta 2', year: '2025',
    cover: cld('yogyakarta-2/cover'),
    desc: 'A second look at Yogyakarta — deeper into the kampung streets, quieter temples, and the golden hour light.',
    photos: [
      { title: 'Candi Sambisari',      img: cld('yogyakarta-2/sambisari'),       cam: 'Sony A7C', lens: '35mm f/1.8', iso: '200',  ss: '1/320s',  ap: 'f/4'   },
      { title: 'Gumuk Pasir',          img: cld('yogyakarta-2/gumuk-pasir'),     cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/800s',  ap: 'f/8'   },
      { title: 'Kalibiru',             img: cld('yogyakarta-2/kalibiru'),        cam: 'Sony A7C', lens: '16mm f/2.8', iso: '100',  ss: '1/500s',  ap: 'f/7.1' },
      { title: 'Timang Beach',         img: cld('yogyakarta-2/timang'),          cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/1000s', ap: 'f/8'   },
      { title: 'Tebing Breksi',        img: cld('yogyakarta-2/breksi'),          cam: 'Sony A7C', lens: '16mm f/2.8', iso: '200',  ss: '1/400s',  ap: 'f/5.6' },
      { title: 'Candi Plaosan',        img: cld('yogyakarta-2/plaosan'),         cam: 'Sony A7C', lens: '35mm f/1.8', iso: '100',  ss: '1/500s',  ap: 'f/4'   },
      { title: 'Hutan Pinus Mangunan', img: cld('yogyakarta-2/pinus-mangunan'),  cam: 'Sony A7C', lens: '50mm f/1.4', iso: '400',  ss: '1/200s',  ap: 'f/2.8' },
      { title: 'Kebun Buah Mangunan',  img: cld('yogyakarta-2/mangunan'),        cam: 'Sony A7C', lens: '85mm f/1.8', iso: '100',  ss: '1/640s',  ap: 'f/4'   },
      { title: 'Embung Nglanggeran',   img: cld('yogyakarta-2/nglanggeran'),     cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/800s',  ap: 'f/8'   },
      { title: 'Candi Ijo',            img: cld('yogyakarta-2/candi-ijo'),       cam: 'Sony A7C', lens: '35mm f/1.8', iso: '200',  ss: '1/400s',  ap: 'f/4'   },
      { title: 'Bukit Bintang',        img: cld('yogyakarta-2/bukit-bintang'),   cam: 'Sony A7C', lens: '50mm f/1.4', iso: '800',  ss: '1/60s',   ap: 'f/2.0' },
      { title: 'Sunrise Merapi',       img: cld('yogyakarta-2/sunrise-merapi'),  cam: 'Sony A7C', lens: '85mm f/1.8', iso: '100',  ss: '1/640s',  ap: 'f/5.6' },
      { title: 'Wedi Ombo Beach',      img: cld('yogyakarta-2/wedi-ombo'),       cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/1000s', ap: 'f/8'   },
      { title: 'Nglanggran Village',   img: cld('yogyakarta-2/nglanggran'),      cam: 'Sony A7C', lens: '35mm f/1.8', iso: '400',  ss: '1/160s',  ap: 'f/2.8' },
      { title: 'Sri Gethuk Waterfall', img: cld('yogyakarta-2/sri-gethuk'),      cam: 'Sony A7C', lens: '16mm f/2.8', iso: '400',  ss: '1/30s',   ap: 'f/8'   },
      { title: 'Obelix Hills',         img: cld('yogyakarta-2/obelix'),          cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/640s',  ap: 'f/7.1' },
      { title: 'Angkringan Lik Man',   img: cld('yogyakarta-2/angkringan'),      cam: 'Sony A7C', lens: '35mm f/1.8', iso: '1600', ss: '1/60s',   ap: 'f/1.8' },
      { title: 'Candi Prambanan Night',img: cld('yogyakarta-2/prambanan-night'), cam: 'Sony A7C', lens: '24mm f/2.8', iso: '3200', ss: '1/30s',   ap: 'f/2.8' },
      { title: 'Kebun Teh Nglinggo',   img: cld('yogyakarta-2/nglinggo'),        cam: 'Sony A7C', lens: '85mm f/1.8', iso: '200',  ss: '1/400s',  ap: 'f/4'   },
      { title: 'Pasar Beringharjo',    img: cld('yogyakarta-2/pasar-beringharjo'),cam: 'Sony A7C', lens: '35mm f/1.8', iso: '800',  ss: '1/80s',   ap: 'f/2.0' },
    ],
  },
  {
    num: 'Series 03', name: 'Bandung', year: '2024',
    cover: cld('bandung/cover'),
    desc: 'Cool highland air, colonial streets, and the particular light of late afternoon in the Parahyangan.',
    photos: [
      { title: 'Braga at Night',       img: cld('bandung/braga-night'),     cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '3200', ss: '1/60s',  ap: 'f/2'   },
      { title: 'Gedung Sate',          img: cld('bandung/gedung-sate'),     cam: 'Fuji X-T4', lens: '18mm f/2',   iso: '200',  ss: '1/400s', ap: 'f/5.6' },
      { title: 'Dago Highlands',       img: cld('bandung/dago'),            cam: 'Fuji X-T4', lens: '50mm f/2',   iso: '100',  ss: '1/800s', ap: 'f/4'   },
      { title: 'Sunday Market',        img: cld('bandung/sunday-market'),   cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '640',  ss: '1/160s', ap: 'f/2.8' },
      { title: 'Kawah Putih Mist',     img: cld('bandung/kawah-putih'),     cam: 'Fuji X-T4', lens: '16mm f/1.4', iso: '100',  ss: '1/125s', ap: 'f/5.6' },
      { title: 'Ciumbuleuit Road',     img: cld('bandung/ciumbuleuit'),     cam: 'Fuji X-T4', lens: '35mm f/1.4', iso: '800',  ss: '1/100s', ap: 'f/2'   },
      { title: 'Punclut Sunrise',      img: cld('bandung/punclut'),         cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '200',  ss: '1/400s', ap: 'f/5.6' },
      { title: 'Tangkuban Perahu',     img: cld('bandung/tangkuban'),       cam: 'Fuji X-T4', lens: '16mm f/1.4', iso: '100',  ss: '1/500s', ap: 'f/8'   },
      { title: 'Lembang Farm',         img: cld('bandung/lembang'),         cam: 'Fuji X-T4', lens: '50mm f/2',   iso: '200',  ss: '1/500s', ap: 'f/4'   },
      { title: 'Asia Afrika Street',   img: cld('bandung/asia-afrika'),     cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '400',  ss: '1/200s', ap: 'f/3.5' },
      { title: 'Ciater Hot Spring',    img: cld('bandung/ciater'),          cam: 'Fuji X-T4', lens: '16mm f/1.4', iso: '400',  ss: '1/125s', ap: 'f/5.6' },
      { title: 'Pasar Baru',           img: cld('bandung/pasar-baru'),      cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '800',  ss: '1/80s',  ap: 'f/2.8' },
      { title: 'Floating Market',      img: cld('bandung/floating-market'), cam: 'Fuji X-T4', lens: '35mm f/1.4', iso: '200',  ss: '1/400s', ap: 'f/4'   },
      { title: 'Situ Patenggang',      img: cld('bandung/situ-patenggang'), cam: 'Fuji X-T4', lens: '16mm f/1.4', iso: '100',  ss: '1/800s', ap: 'f/7.1' },
      { title: 'Museum Geologi',       img: cld('bandung/museum-geologi'),  cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '400',  ss: '1/160s', ap: 'f/4'   },
      { title: 'Saung Angklung',       img: cld('bandung/saung-angklung'),  cam: 'Fuji X-T4', lens: '50mm f/2',   iso: '800',  ss: '1/80s',  ap: 'f/2.8' },
      { title: 'Cihampelas Walk',      img: cld('bandung/cihampelas'),      cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '400',  ss: '1/200s', ap: 'f/3.5' },
      { title: 'Kebun Mawar Situhapa', img: cld('bandung/situhapa'),        cam: 'Fuji X-T4', lens: '85mm f/2',   iso: '200',  ss: '1/400s', ap: 'f/3.5' },
      { title: 'Tebing Keraton',       img: cld('bandung/tebing-keraton'),  cam: 'Fuji X-T4', lens: '16mm f/1.4', iso: '100',  ss: '1/640s', ap: 'f/6.3' },
      { title: 'Curug Cimahi',         img: cld('bandung/curug-cimahi'),    cam: 'Fuji X-T4', lens: '16mm f/1.4', iso: '400',  ss: '1/30s',  ap: 'f/8'   },
    ],
  },
  {
    num: 'Series 04', name: 'Garut', year: '2025',
    cover: cld('garut/cover'),
    desc: 'Home — the quiet beauty of Garut, from volcanic lakes to rice terraces bathed in morning light.',
    photos: [
      { title: 'Situ Bagendit',         img: cld('garut/situ-bagendit'),     cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/640s',  ap: 'f/7.1' },
      { title: 'Kawah Papandayan',      img: cld('garut/papandayan'),        cam: 'Sony A7C', lens: '16mm f/2.8', iso: '100',  ss: '1/500s',  ap: 'f/8'   },
      { title: 'Curug Orok',            img: cld('garut/curug-orok'),        cam: 'Sony A7C', lens: '16mm f/2.8', iso: '400',  ss: '1/30s',   ap: 'f/8'   },
      { title: 'Cipanas View',          img: cld('garut/cipanas'),           cam: 'Sony A7C', lens: '50mm f/1.4', iso: '100',  ss: '1/800s',  ap: 'f/4'   },
      { title: 'Puncak Gunung Guntur',  img: cld('garut/gunung-guntur'),     cam: 'Sony A7C', lens: '24mm f/2.8', iso: '200',  ss: '1/400s',  ap: 'f/6.3' },
      { title: 'Kampung Naga',          img: cld('garut/kampung-naga'),      cam: 'Sony A7C', lens: '35mm f/1.8', iso: '200',  ss: '1/400s',  ap: 'f/4'   },
      { title: 'Sawah Cikajang',        img: cld('garut/cikajang'),          cam: 'Sony A7C', lens: '85mm f/1.8', iso: '100',  ss: '1/800s',  ap: 'f/5.6' },
      { title: 'Situ Cangkuang',        img: cld('garut/cangkuang'),         cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/640s',  ap: 'f/7.1' },
      { title: 'Pantai Santolo',        img: cld('garut/santolo'),           cam: 'Sony A7C', lens: '16mm f/2.8', iso: '100',  ss: '1/1000s', ap: 'f/8'   },
      { title: 'Talaga Bodas',          img: cld('garut/talaga-bodas'),      cam: 'Sony A7C', lens: '24mm f/2.8', iso: '200',  ss: '1/320s',  ap: 'f/5.6' },
      { title: 'Gunung Cikurai',        img: cld('garut/cikurai'),           cam: 'Sony A7C', lens: '16mm f/2.8', iso: '100',  ss: '1/500s',  ap: 'f/7.1' },
      { title: 'Alun-Alun Garut',       img: cld('garut/alun-alun'),         cam: 'Sony A7C', lens: '35mm f/1.8', iso: '400',  ss: '1/200s',  ap: 'f/3.5' },
      { title: 'Dodol Garut Shop',      img: cld('garut/dodol'),             cam: 'Sony A7C', lens: '50mm f/1.4', iso: '800',  ss: '1/80s',   ap: 'f/2.0' },
      { title: 'Curug Neglasari',       img: cld('garut/neglasari'),         cam: 'Sony A7C', lens: '16mm f/2.8', iso: '400',  ss: '1/30s',   ap: 'f/8'   },
      { title: 'Pantai Rancabuaya',     img: cld('garut/rancabuaya'),        cam: 'Sony A7C', lens: '24mm f/2.8', iso: '100',  ss: '1/1000s', ap: 'f/8'   },
      { title: 'Situs Karacak Valley',  img: cld('garut/karacak'),           cam: 'Sony A7C', lens: '35mm f/1.8', iso: '200',  ss: '1/400s',  ap: 'f/4'   },
      { title: 'Perkebunan Teh Dayeuh', img: cld('garut/dayeuh-teh'),        cam: 'Sony A7C', lens: '85mm f/1.8', iso: '200',  ss: '1/400s',  ap: 'f/5.6' },
      { title: 'Curug Sanghyang Taraje',img: cld('garut/sanghyang-taraje'),  cam: 'Sony A7C', lens: '16mm f/2.8', iso: '400',  ss: '1/60s',   ap: 'f/8'   },
      { title: 'Pasar Ceplak',          img: cld('garut/pasar-ceplak'),      cam: 'Sony A7C', lens: '35mm f/1.8', iso: '800',  ss: '1/80s',   ap: 'f/2.0' },
      { title: 'Sunset Pasir Batang',   img: cld('garut/pasir-batang'),      cam: 'Sony A7C', lens: '85mm f/1.8', iso: '100',  ss: '1/640s',  ap: 'f/5.6' },
    ],
  },
  {
    num: 'Series 05', name: 'Random', year: '2024–2025',
    cover: cld('random/cover'),
    desc: 'Unplanned frames — the quiet beauty found in between destinations, in ordinary moments made extraordinary.',
    photos: [
      { title: 'Frame 01', img: cld('random/01'), cam: 'Sony A7C',  lens: '35mm f/1.8', iso: '400',  ss: '1/320s',  ap: 'f/2.0' },
      { title: 'Frame 02', img: cld('random/02'), cam: 'Sony A7C',  lens: '50mm f/1.4', iso: '800',  ss: '1/60s',   ap: 'f/1.8' },
      { title: 'Frame 03', img: cld('random/03'), cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '200',  ss: '1/400s',  ap: 'f/4'   },
      { title: 'Frame 04', img: cld('random/04'), cam: 'Sony A7C',  lens: '85mm f/1.8', iso: '100',  ss: '1/640s',  ap: 'f/4'   },
      { title: 'Frame 05', img: cld('random/05'), cam: 'Fuji X-T4', lens: '16mm f/1.4', iso: '400',  ss: '1/125s',  ap: 'f/5.6' },
      { title: 'Frame 06', img: cld('random/06'), cam: 'Sony A7C',  lens: '24mm f/2.8', iso: '200',  ss: '1/500s',  ap: 'f/5.6' },
      { title: 'Frame 07', img: cld('random/07'), cam: 'Sony A7C',  lens: '35mm f/1.8', iso: '1600', ss: '1/80s',   ap: 'f/1.8' },
      { title: 'Frame 08', img: cld('random/08'), cam: 'Fuji X-T4', lens: '50mm f/2',   iso: '100',  ss: '1/800s',  ap: 'f/4'   },
      { title: 'Frame 09', img: cld('random/09'), cam: 'Sony A7C',  lens: '16mm f/2.8', iso: '100',  ss: '1/1000s', ap: 'f/8'   },
      { title: 'Frame 10', img: cld('random/10'), cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '640',  ss: '1/160s',  ap: 'f/2.8' },
      { title: 'Frame 11', img: cld('random/11'), cam: 'Sony A7C',  lens: '50mm f/1.4', iso: '200',  ss: '1/400s',  ap: 'f/2.8' },
      { title: 'Frame 12', img: cld('random/12'), cam: 'Sony A7C',  lens: '85mm f/1.8', iso: '400',  ss: '1/200s',  ap: 'f/3.5' },
      { title: 'Frame 13', img: cld('random/13'), cam: 'Fuji X-T4', lens: '35mm f/1.4', iso: '800',  ss: '1/100s',  ap: 'f/2'   },
      { title: 'Frame 14', img: cld('random/14'), cam: 'Sony A7C',  lens: '24mm f/2.8', iso: '100',  ss: '1/640s',  ap: 'f/7.1' },
      { title: 'Frame 15', img: cld('random/15'), cam: 'Sony A7C',  lens: '35mm f/1.8', iso: '400',  ss: '1/250s',  ap: 'f/2.8' },
      { title: 'Frame 16', img: cld('random/16'), cam: 'Fuji X-T4', lens: '23mm f/2',   iso: '200',  ss: '1/500s',  ap: 'f/4'   },
      { title: 'Frame 17', img: cld('random/17'), cam: 'Sony A7C',  lens: '50mm f/1.4', iso: '800',  ss: '1/80s',   ap: 'f/2.0' },
      { title: 'Frame 18', img: cld('random/18'), cam: 'Sony A7C',  lens: '16mm f/2.8', iso: '200',  ss: '1/400s',  ap: 'f/5.6' },
      { title: 'Frame 19', img: cld('random/19'), cam: 'Fuji X-T4', lens: '85mm f/2',   iso: '400',  ss: '1/200s',  ap: 'f/3.5' },
      { title: 'Frame 20', img: cld('random/20'), cam: 'Sony A7C',  lens: '35mm f/1.8', iso: '100',  ss: '1/500s',  ap: 'f/4'   },
    ],
  },
];

await db.ensureSchema();

const existing = (await db.queryOne(`SELECT COUNT(*)::int AS n FROM series`)).n;
if (existing > 0 && !FORCE) {
  console.log(`[seed] DB already has ${existing} series — skipping. Use --force to wipe and re-seed.`);
  await db.pool.end();
  return;
}

if (FORCE) {
  await db.query(`TRUNCATE TABLE photos, series RESTART IDENTITY CASCADE`);
  console.log('[seed] cleared existing data');
}

await db.withTx(async (client) => {
  for (let si = 0; si < SERIES.length; si++) {
    const s = SERIES[si];
    const r = await client.query(
      `INSERT INTO series (num, name, year, cover, description, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [s.num, s.name, s.year, s.cover, s.desc, si]
    );
    const seriesId = r.rows[0].id;
    for (let pi = 0; pi < s.photos.length; pi++) {
      const p = s.photos[pi];
      await client.query(
        `INSERT INTO photos (series_id, title, img, cam, lens, iso, ss, ap, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [seriesId, p.title, p.img, p.cam, p.lens, p.iso, p.ss, p.ap, pi]
      );
    }
  }
});

const total = (await db.queryOne(`SELECT COUNT(*)::int AS n FROM photos`)).n;
console.log(`[seed] inserted ${SERIES.length} series and ${total} photos.`);
await db.pool.end();
}

