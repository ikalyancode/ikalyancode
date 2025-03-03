#[macro_use]
extern crate rocket;
use rocket::serde::json::Json;
use diesel::prelude::*;
use crate::models::{User, NewUser};
use crate::db::establish_connection;

#[get("/users")]
fn get_users() -> Json<Vec<User>> {
    use crate::schema::users::dsl::*;
    let conn = &mut establish_connection().get().expect("DB connection error");
    let results = users.load::<User>(conn).expect("Error loading users");
    Json(results)
}

#[post("/users", format = "json", data = "<new_user>")]
fn create_user(new_user: Json<NewUser>) -> Json<User> {
    use crate::schema::users;
    let conn = &mut establish_connection().get().expect("DB connection error");

    diesel::insert_into(users::table)
        .values(&new_user.into_inner())
        .get_result::<User>(conn)
        .expect("Error inserting user")
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![get_users, create_user])
}
