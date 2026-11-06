import React, { useEffect, useState } from "react";
import { useAppContext } from "@/lib/app-context";

const SlowLoader: React.FC = () => {
  const { dispatch } = useAppContext();

  const [width, setPercent] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(60);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    const startLoader = () => {
      return setInterval(() => {
        setPercent((p) => {
          /* console.log("Val", Math.floor(p)); */
          if (Math.ceil(p) === 192 && id) {
            clearInterval(id);
            dispatch({ type: "SET_APP_SETUP", payload: false });
            return p;
          }
          return p + 3.2;
        });
        setSeconds((s) => {
          if (s === 0) {
            return s;
          }
          return s - 1;
        });
      }, 1000);
    };

    id = startLoader();

    return () => {
      if (id) clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
      <h1 className="text-white font-bold">
        Please wait, Application Setup in Progress
      </h1>
      <div className="relative border box-content border-2 border-black w-48 h-12">
        <span className="absolute top-3 right-2">{seconds}s</span>
        <div
          className="bg-white h-12"
          style={{
            width,
          }}
        ></div>
      </div>
    </div>
  );
};

export default SlowLoader;
