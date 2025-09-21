export const useGetUserInfo = () => {
    const { name, profilePhoto, userID, isAuth } =
      JSON.parse(localStorage.getItem("auth")) || {};
  
    return { name, profilePhoto, userID, isAuth };
  }; //get info from the local storage since its in json back into an object