const Loading = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <i
        data-testid="spinner"
        className="fa-solid fa-spinner fa-spin text-white fa-2x"
      ></i>
    </div>
  );
};

export default Loading;
