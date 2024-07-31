import "./stylesheets/SideBar.css";

function SideBar() {
  return (
    <div className="flex h-screen w-1/6 bg-indigo-400">
      <div className="side-bar-body w-full">
        <div className="flex items-center ps-5 h-20 border-b-4">
          <h1 className="title text-lg font-bold">Chats</h1>
        </div>
        <div className="chats flex flex-col flex-1 ps-7 text-base mt-5">
          <ul>
            <li>Chat 1</li>
            <li>Chat 2</li>
            <li>Chat 3</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SideBar;
