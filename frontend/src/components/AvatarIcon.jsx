function AvatarIcon({ username }) {
  return (
    <img
      src={`https://ui-avatars.com/api/?name=${username}&background=random&color=fff`}
      alt="avatar"
      className="rounded-full w-10 h-10 me-3"
    />
  );
}

export default AvatarIcon;
