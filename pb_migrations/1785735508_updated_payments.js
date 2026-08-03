/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571");

  const proof = new SchemaField({
    "name": "proof",
    "type": "file",
    "system": false,
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "mimeTypes": [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
      ],
      "thumbs": [],
      "maxSelect": 1,
      "maxSize": 5242880,
      "protected": false
    }
  });

  collection.fields.add(proof);

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571");

  const proof = collection.fields.find((f) => f.name === "proof");
  if (proof) {
    collection.fields.remove(proof);
  }

  return app.save(collection);
})
