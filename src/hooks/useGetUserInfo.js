export const useGetUserInfo = () => {
  const storedAuth = JSON.parse(localStorage.getItem("auth")) || {};

  let name = storedAuth.name;
  const profilePhoto = storedAuth.profilePhoto || null;
  const userID = storedAuth.userID || null;
  const isAuth = storedAuth.isAuth || false;

  // for the fake user 
  if (!name && storedAuth.email) {
    name = storedAuth.email.split("@")[0]; // use part before @ in email as name
  }

  // Extra fallback
  if (!name) {
    name = "User";
  }

  return { name, profilePhoto, userID, isAuth };
};
