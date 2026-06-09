import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://aetheris-pbl-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkData() {
  const baws1Ref = ref(db, "sensorLive/BAWS1");
  const sensor1Ref = ref(db, "sensorLive/sensor_001");
  
  const baws1Snap = await get(baws1Ref);
  console.log("BAWS1 data:", baws1Snap.val());
  
  const sensor1Snap = await get(sensor1Ref);
  console.log("sensor_001 data:", sensor1Snap.val());
  
  process.exit();
}

checkData();
