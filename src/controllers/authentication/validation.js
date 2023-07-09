import * as Yup from "yup";

export const RegisterValidationSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone is required"),
});

export const LoginValidationSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

export const changeUsernameSchema = Yup.object({
  currentUsername: Yup.string().required("Username is required"),
  newUsername: Yup.string().required("Username is required"),
});

export const changePhoneSchema = Yup.object({
  currentPhone: Yup.string()
    .matches(/^\+?\d{10,12}$/, "Invalid phone number")
    .required("Phone number is required"),
  newPhone: Yup.string()
    .matches(/^\+?\d{10,12}$/, "Invalid phone number")
    .required("Phone number is required"),
});

export const changeEmailSchema = Yup.object({
  currentEmail: Yup.string()
    .email("email must be a valid email.")
    .required("Email is required"),
  newEmail: Yup.string()
    .email("email must be a valid email.")
    .required("Email is required"),
});

export const changePasswordSchema = Yup.object({
  currentPassword: Yup.string()
    .min(6, "Password must be at least 6 characters.")
    .matches(/^[a-zA-Z0-9]+$/, "Password must be alphanumeric.")
    .required("Current password is required."),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters.")
    .matches(/^[a-zA-Z0-9]+$/, "Password must be alphanumeric.")
    .notOneOf(
      [Yup.ref("currentPassword")],
      "New password must be different from current password."
    )
    .required("New password is required."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match.")
    .required("Confirm password is required."),
});

export const ressetPassword = Yup.object({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters.")
    .matches(/^[a-zA-Z0-9]+$/, "Password must be alphanumeric.")
    .notOneOf(
      [Yup.ref("currentPassword")],
      "New password must be different from current password."
    )
    .required("New password is required."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match.")
    .required("Confirm password is required."),
});
