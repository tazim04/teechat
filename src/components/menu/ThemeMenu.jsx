function ThemeMenu() {
  //   const [theme, setTheme] = useTheme(); // This is a custom hook that we will create later

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <div className="bg-indigo-400 text-gray-200 w-72 h-80 mx-auto rounded-xl shadow-2xl">
      <div className="flex justify-center p-5">
        <h5 className="font-bold " style={{ fontSize: "1rem" }}>
          Change the theme.
        </h5>
      </div>
    </div>
  );
}

export default ThemeMenu;
