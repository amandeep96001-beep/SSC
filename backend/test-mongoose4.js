import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  o: [{ type: String }]
});
const Model = mongoose.model('Test', schema);
try {
  const str = "[\n' +\n  \"  [ '¹H', '²H' ],\n\" +\n  \"  [ '¹⁴C', '¹⁴N' ],\n\" +\n  \"  [ '²³Na', '²⁴Mg' ],\n\" +\n  \"  [ '⁴⁰Ar', '⁴⁰Ca' ]\n\" +\n  ']";
  const doc = new Model({ o: [ str ] });
  await doc.validate();
  console.log("Success String");
} catch (e) { console.log("String Error:", e.message); }
