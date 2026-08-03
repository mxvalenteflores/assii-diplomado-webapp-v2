/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "@request.auth.id != \"\"",
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "id": "pbc_3135925398",
    "name": "registrations",
    "system": false,
    "type": "base",
  })

  collection.fields.add(
    new SchemaField({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text724990059",
      "max": 0,
      "min": 0,
      "name": "studentId",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }),
    new SchemaField({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text724990060",
      "max": 0,
      "min": 0,
      "name": "formId",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }),
    new SchemaField({
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text724990061",
      "max": 0,
      "min": 0,
      "name": "data",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    })
  )

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3135925398")
  return app.delete(collection)
})
