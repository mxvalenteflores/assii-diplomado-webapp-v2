/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571");

  collection.fields.add({
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

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_631030571");

  const idx = collection.fields.findIndex((f) => f.name === "proof");
  if (idx >= 0) {
    collection.fields.removeAt(idx);
  }

  return app.save(collection);
})
