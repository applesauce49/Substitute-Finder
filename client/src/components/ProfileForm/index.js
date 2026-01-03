import React, { useMemo, useState } from 'react';
import { UserAttributeEditor } from '../user/UserAttributeEditor';

export const ProfileForm = ({ initialData = {}, onSubmit }) => {
  const [email, setEmail] = useState(initialData.email ?? "");
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [about, setAbout] = useState(initialData.about ?? "");

  const initialAttrValues = useMemo(() => {
    const map = {};
    if (Array.isArray(initialData.attributes)) {
      initialData.attributes.forEach(attr => {
        map[attr.key] = attr.value;
      });
    }
    return map;
  }, [initialData.attributes]);

  const [attributeValues, setAttributeValues] = useState(initialAttrValues);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.({
      email,
      phone,
      about,
      attributes: Object.entries(attributeValues).map(([key, value]) => ({ key, value })),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="email">Email address</label>
        <input
          type="email"
          className="form-control"
          id="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          type="text"
          className="form-control"
          id="phone"
          placeholder="555-555-5555"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="about">About</label>
        <input
          type="text"
          className="form-control"
          id="about"
          placeholder="Please input what meetings you enjoy subbing for."
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
      </div>
      <div className="form-group">
        {/* DYNAMIC USER ATTRIBUTES */}
        <UserAttributeEditor
          initialValues={attributeValues}
          onChange={setAttributeValues}
          onlyEditable
          title="Your Preferences"
        />
      </div>

      <div className="form-group">
        <button className="form-control btn btn-primary" type="submit">
          Submit
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
