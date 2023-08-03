"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useRef } from "react";
import { palettes } from "@/app/data/palettes";
import styles from "./Footer.module.css";

const paletteAttributes = [
  "--accent-primary-1",
  "--accent-primary-2",
  "--accent-primary-3",
  "--accent-primary-light",

  "--accent-secondary-1",
  "--accent-secondary-2",
  "--accent-secondary-3",
  "--accent-secondary-light",

  "--accent-tertiary-1",
  "--accent-tertiary-2",
  "--accent-tertiary-3",
  "--accent-tertiary-light",
];

export function Footer() {
  const [showThemes, setShowThemes] = useState(false);
  const [showPalettes, setShowPalettes] = useState(false);

  const [activeTheme, setActiveTheme] = useState(2);
  const [activePalette, setActivePalette] = useState(0);

  const activeIcon = <FontAwesomeIcon icon={faCheck} />;
  const themeRef = useRef(null);
  const paletteRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setShowThemes(false);
      }
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        setShowPalettes(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showThemes, showPalettes]);

  useEffect(() => {
    const setTheme = () => {
      const theme = parseInt(localStorage.getItem("theme") ?? 2);

      setActiveTheme(theme);
      changeCssProperties(theme);
    };

    const changeSystemTheme = (e) => {
      if (!activeTheme === 2) return;
      if (e.matches) {
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.style.colorScheme = "light";
      }
    };

    const system = window.matchMedia("(prefers-color-scheme: dark)");
    if (system.addEventListener) {
      system.addEventListener("change", changeSystemTheme);
    } else {
      system.addListener(changeSystemTheme);
    }

    setTheme();
    return () => {
      if (system.removeEventListener) {
        system.removeEventListener("change", changeSystemTheme);
      } else {
        system.removeListener(changeSystemTheme);
      }
    };
  }, [activeTheme]);

  useEffect(() => {
    const setPalette = () => {
      const palette = localStorage.getItem("palette");

      setActivePalette(isNaN(parseInt(palette)) ? 0 : parseInt(palette));
      setCssVariables(palettes[parseInt(palette) ?? 0]);
    };

    setPalette();
  }, []);

  const changeCssProperties = (theme) => {
    const darkTheme = window.matchMedia("(prefers-color-scheme: dark)");

    if (theme === 0 || (theme === 2 && !darkTheme.matches)) {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.style.colorScheme = "light";
    } else if (theme === 1 || (theme === 2 && darkTheme.matches)) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
    }
  };

  const setTheme = (theme) => {
    if (![0, 1, 2].includes(theme)) {
      theme = 2;
    }

    localStorage.setItem("theme", theme);
    setActiveTheme(theme);
    changeCssProperties(theme);
  };

  const setCssVariables = (palette) => {
    if (!palette) return;
    paletteAttributes.forEach((attr, index) => {
      document.documentElement.style.setProperty(attr, palette.colors[index]);
    });
  };

  const setPalette = (index) => {
    setActivePalette(index);
    localStorage.setItem("palette", index);
    setCssVariables(palettes[index]);
  };

  const lightModes = ["Light", "Dark", "System"];

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.icon}>
          <div>
            <div />
            <p>M</p>
          </div>
        </div>

        <div className={styles.themeContainer}>
          <div ref={themeRef}>
            <button
              onClick={() => {
                setShowPalettes(false);
                setShowThemes((prev) => !prev);
              }}
              style={{
                backgroundColor: showThemes
                  ? "var(--background-secondary)"
                  : "",
              }}
            >
              <div>
                <svg
                  fill="none"
                  viewBox="2 2 20 20"
                  width="12"
                  height="12"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    fill="currentColor"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                <span>{lightModes[activeTheme]}</span>
              </div>
            </button>

            {showThemes && (
              <div className={styles.popup}>
                <ul>
                  {lightModes.map((mode, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setTheme(index);
                      }}
                    >
                      {mode}
                      {activeTheme === index ? activeIcon : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div ref={paletteRef}>
            <button
              onClick={() => {
                setShowThemes(false);
                setShowPalettes((prev) => !prev);
              }}
              style={{
                backgroundColor: showPalettes
                  ? "var(--background-secondary)"
                  : "",
              }}
            >
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="var(--foreground-primary)"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" />
                  <path d="M8.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M12.5 7.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                  <path d="M16.5 10.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                </svg>
                <span>{palettes[activePalette].name}</span>
              </div>
            </button>

            {showPalettes && (
              <div className={styles.popup}>
                <ul>
                  {palettes.map((palette, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setPalette(index);
                      }}
                    >
                      {palette.name}
                      {activePalette === index ? activeIcon : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={styles.socials}>
          <a href="https://discord.gg/JymNJbgqcC" target="_blank">
            <svg
              width="24"
              height="24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 5 30.67 23.25"
            >
              <title>Discord</title>
              <path d="M26.0015 6.9529C24.0021 6.03845 21.8787 5.37198 19.6623 5C19.3833 5.48048 19.0733 6.13144 18.8563 6.64292C16.4989 6.30193 14.1585 6.30193 11.8336 6.64292C11.6166 6.13144 11.2911 5.48048 11.0276 5C8.79575 5.37198 6.67235 6.03845 4.6869 6.9529C0.672601 12.8736 -0.41235 18.6548 0.130124 24.3585C2.79599 26.2959 5.36889 27.4739 7.89682 28.2489C8.51679 27.4119 9.07477 26.5129 9.55525 25.5675C8.64079 25.2265 7.77283 24.808 6.93587 24.312C7.15286 24.1571 7.36986 23.9866 7.57135 23.8161C12.6241 26.1255 18.0969 26.1255 23.0876 23.8161C23.3046 23.9866 23.5061 24.1571 23.7231 24.312C22.8861 24.808 22.0182 25.2265 21.1037 25.5675C21.5842 26.5129 22.1422 27.4119 22.7621 28.2489C25.2885 27.4739 27.8769 26.2959 30.5288 24.3585C31.1952 17.7559 29.4733 12.0212 26.0015 6.9529ZM10.2527 20.8402C8.73376 20.8402 7.49382 19.4608 7.49382 17.7714C7.49382 16.082 8.70276 14.7025 10.2527 14.7025C11.7871 14.7025 13.0425 16.082 13.0115 17.7714C13.0115 19.4608 11.7871 20.8402 10.2527 20.8402ZM20.4373 20.8402C18.9183 20.8402 17.6768 19.4608 17.6768 17.7714C17.6768 16.082 18.8873 14.7025 20.4373 14.7025C21.9717 14.7025 23.2271 16.082 23.1961 17.7714C23.1961 19.4608 21.9872 20.8402 20.4373 20.8402Z" />
            </svg>
          </a>

          <a
            href="https://github.com/joewrotehaikus/mnemefeast"
            target="_blank"
          >
            <svg width="24" height="24" fill="currentColor" viewBox="3 3 18 18">
              <title>GitHub</title>
              <path d="M12 3C7.0275 3 3 7.12937 3 12.2276C3 16.3109 5.57625 19.7597 9.15374 20.9824C9.60374 21.0631 9.77249 20.7863 9.77249 20.5441C9.77249 20.3249 9.76125 19.5982 9.76125 18.8254C7.5 19.2522 6.915 18.2602 6.735 17.7412C6.63375 17.4759 6.19499 16.6569 5.8125 16.4378C5.4975 16.2647 5.0475 15.838 5.80124 15.8264C6.51 15.8149 7.01625 16.4954 7.18499 16.7723C7.99499 18.1679 9.28875 17.7758 9.80625 17.5335C9.885 16.9337 10.1212 16.53 10.38 16.2993C8.3775 16.0687 6.285 15.2728 6.285 11.7432C6.285 10.7397 6.63375 9.9092 7.20749 9.26326C7.1175 9.03257 6.8025 8.08674 7.2975 6.81794C7.2975 6.81794 8.05125 6.57571 9.77249 7.76377C10.4925 7.55615 11.2575 7.45234 12.0225 7.45234C12.7875 7.45234 13.5525 7.55615 14.2725 7.76377C15.9937 6.56418 16.7475 6.81794 16.7475 6.81794C17.2424 8.08674 16.9275 9.03257 16.8375 9.26326C17.4113 9.9092 17.76 10.7281 17.76 11.7432C17.76 15.2843 15.6563 16.0687 13.6537 16.2993C13.98 16.5877 14.2613 17.1414 14.2613 18.0065C14.2613 19.2407 14.25 20.2326 14.25 20.5441C14.25 20.7863 14.4188 21.0746 14.8688 20.9824C16.6554 20.364 18.2079 19.1866 19.3078 17.6162C20.4077 16.0457 20.9995 14.1611 21 12.2276C21 7.12937 16.9725 3 12 3Z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
