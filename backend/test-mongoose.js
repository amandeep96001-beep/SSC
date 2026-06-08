import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  o: [{ type: String }]
});
const Model = mongoose.model('Test', schema);
try {
  const doc = new Model({ o: [ "some string" ] });
  await doc.validate();
  console.log("Success 1");
} catch (e) { console.log(e.message); }

try {
  const doc = new Model({ o: [ ["some array"] ] });
  await doc.validate();
  console.log("Success 2");
} catch (e) { console.log(e.message); }

try {
  const doc = new Model({ o: [ {a: 1} ] });
  await doc.validate();
  console.log("Success 3");
} catch (e) { console.log(e.message); }
