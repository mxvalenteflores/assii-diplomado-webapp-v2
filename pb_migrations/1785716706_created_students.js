/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "@request.auth.id != \"\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "email_students",
        "max": 0,
        "min": 0,
        "name": "email",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "email"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_fn",
        "max": 0,
        "min": 0,
        "name": "firstName",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_ln",
        "max": 0,
        "min": 0,
        "name": "lastName",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_ph",
        "max": 0,
        "min": 0,
        "name": "phone",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_em",
        "max": 0,
        "min": 0,
        "name": "empresa",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_pu",
        "max": 0,
        "min": 0,
        "name": "puesto",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_fd",
        "max": 0,
        "min": 0,
        "name": "formData",
        "pattern": "",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_3827815851",
    "indexes": [],
    "listRule": "@request.auth.id != \"\"",
    "name": "students",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3827815851");
  return app.delete(collection);
})
