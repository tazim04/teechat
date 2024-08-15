function Menu({ showMenu }) {
  return (
    <div
      className={`absolute left-[20.5rem] bg-indigo-400 w-72 h-80 mx-auto mt-3 rounded-xl transition-opacity duration-75 ease-in-out shadow-2xl ${
        showMenu ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className=" flex justify-center pt-5">
        <h5 className="font-bold" style={{ fontSize: "1rem" }}>
          Menu
        </h5>
      </div>
    </div>
  );
}

export default Menu;
