function LogoutMenu() {
  // For now, until jwt is implemented, we will redirect to the home page
  const handleLogout = () => {
    window.location.href = "/"; // Redirect to the home page
  };

  return (
    <div className="text-gray-200 w-72 h-80 mx-auto rounded-xl shadow-2xl">
      <div className="flex justify-center p-5">
        <h5 className="font-bold " style={{ fontSize: "1rem" }}>
          See you soon.
        </h5>
      </div>
      <div className="text-base absolute left-1/4 bottom-40">
        <button
          className="text-center rounded-md border-2 border-gray-300 py-2 px-10 mx-auto items-center transition-all duration-300 ease-in-out 
          hover:bg-rose-500 hover:border-transparent"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default LogoutMenu;