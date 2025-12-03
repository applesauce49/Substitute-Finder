import React from "react";
import { FaShareSquare } from "react-icons/fa";
import Auth from "../utils/auth";
import ProfileModal from "../components/Modal";

const Profile = ( { me }) => {
  console.log ("Rendering Profile Page with me:", me);
  if (!me?.username) {
    return (
      <h4>
        You need to be logged in to see this. Use the navigation links above to
        sign up or log in!
      </h4>
    );
  }

  return (
    <div className="ml-auto m-auto w-60 profile-card">
      <div className="card">
        <div className="ml-auto mr-auto">{/* <ImageUpload/> */}</div>
        {Auth.loggedIn() && (
          <div className="flex-row ml-auto mr-auto">
            <h1 className="pt-3 display-inline-block text-dark">
              {me.username}
              <hr />
            </h1>
          </div>
        )}
        <div className="flex-row mb-0 ml-auto mr-auto">
          <p className="text-dark text-center ml-2 mr-2 user-about">{me.about}</p>
       
        </div>
        <div className="flex-column ml-3">
          <hr></hr>
          <h5 className="text-dark text-center">
            Contact Me
          </h5>
        </div>
        <div className="flex-column text-center ml-3 mr-3">
          <p className="w-100">
            <span className="text-dark">Email: </span>
            {me.email}&nbsp;
            <a
              id="mail"
              rel="noopener noreferrer"
              target="_blank"
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${me.email}`}
            >
              <FaShareSquare className="email-icon mb-1" />
            </a>
            <br />
            <span className="text-dark">Phone Number: </span> {me.phone}
          </p>
        </div>
      </div>
      <div className="w-50 mr-auto ml-auto">
        <ProfileModal me={me} />
      </div>
    </div>
  );
};

export default Profile;
