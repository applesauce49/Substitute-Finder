import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { FaShareSquare } from "react-icons/fa";

import { useQuery } from "@apollo/client";
import { QUERY_USER, QUERY_ME } from "../utils/queries";
import Auth from "../utils/auth";
import ProfileModal from "../components/Modal";

const Profile = (props) => {
  const { username: userParam } = useParams();

  const { loading, data } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
    variables: { username: userParam },
  });

  const user = data?.me || data?.user || {};

  // navigate to personal profile page if username is yours
  if (Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/profile/:username" />;
  }
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user?.username) {
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
              {user.username}
              <hr />
            </h1>
          </div>
        )}
        <div className="flex-row mb-0 ml-auto mr-auto">
          <p className="text-dark text-center ml-2 mr-2 user-about">{user.about}</p>
       
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
            {user.email}&nbsp;
            <a
              id="mail"
              rel="noopener noreferrer"
              target="_blank"
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${user.email}`}
            >
              <FaShareSquare className="email-icon mb-1" />
            </a>
            <br />
            <span className="text-dark">Phone Number: </span> {user.phone}
          </p>
        </div>
      </div>
      <div className="w-50 mr-auto ml-auto">
        <ProfileModal />
      </div>
    </div>
  );
};

export default Profile;
