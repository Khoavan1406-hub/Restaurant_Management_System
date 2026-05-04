const validateCreateUser = ({ id_number, username, password, phone_number, contact_email, role }) => {
  if (!id_number || !username || !password || !phone_number || !contact_email || !role) {
    return {
      status: 400,
      message: "Required: id_number, username, password, phone_number, contact_email, role",
    };
  }

  if (!/^[0-9]{12}$/.test(String(id_number).trim())) {
    return {
      status: 400,
      message: "ID number must be exactly 12 digits",
    };
  }

  if (!/^[0-9]{10,11}$/.test(String(phone_number).trim())) {
    return {
      status: 400,
      message: "Phone number must be 10 to 11 digits",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contact_email).trim())) {
    return {
      status: 400,
      message: "Contact email format is invalid",
    };
  }

  if (!["Chef", "Waiter"].includes(role)) {
    return {
      status: 400,
      message: "Role must be Chef or Waiter",
    };
  }

  return null;
};

module.exports = { validateCreateUser };