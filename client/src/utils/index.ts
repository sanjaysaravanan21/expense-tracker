export const convertDashedToCapitalized = (input: string): string => {
  return input
    .split("-") // Split the string by dashes
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(" "); // Join the words with spaces
};

export const convertTo24HourFormat = (time: string): string | null => {
  // Regular expression to match AM/PM time format
  const regex = /^(0?[1-9]|1[0-2]):([0-5][0-9]) ?([AP]M)$/i;

  const match = time.match(regex);
  if (!match) {
    return null; // Return null if the input format is invalid
  }

  let hours = parseInt(match[1], 10); // Get the hours part
  const minutes = match[2]; // Get the minutes part
  const period = match[3].toUpperCase(); // Get the AM/PM part

  // Convert hours based on AM/PM
  if (period === "PM" && hours < 12) {
    hours += 12; // Convert PM hours to 24-hour format
  } else if (period === "AM" && hours === 12) {
    hours = 0; // Convert 12 AM to 0 hours
  }

  // Format hours to always be two digits
  const formattedHours = hours.toString().padStart(2, "0");

  return `${formattedHours}:${minutes}`; // Return the formatted time
};

export const getRandomColor = (): string => {
  const letters: string = "0123456789ABCDEF";
  let color: string = "#";
  for (let i: number = 0; i < 6; i += 1) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const getCurrentDate = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getAdjacentDate = (
  dateString: string,
  direction: "next" | "prev"
): string => {
  // Parse the input date string
  const date = new Date(dateString);

  // Validate the date
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format. Please use 'YYYY-MM-DD'.");
  }

  // Adjust the date based on the direction
  if (direction === "next") {
    date.setDate(date.getDate() + 1);
  } else if (direction === "prev") {
    date.setDate(date.getDate() - 1);
  } else {
    throw new Error("Direction must be either 'next' or 'prev'.");
  }

  // Format the new date back to 'YYYY-MM-DD'
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getRandomNumber = (N: number): number => {
  if (N < 0) {
    throw new Error("N must be a non-negative number.");
  }
  return Math.floor(Math.random() * (N + 1));
};

export const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at indices i and j
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

export const getStartOfMonth = (): string => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 2).toISOString().split("T")[0];
};

export const getNextPrevMonth = (startDate: string, type: "next" | "prev") => {
  const date = new Date(startDate); // Convert the input string to a Date object

  // Determine the new month based on the type parameter
  if (type === "next") {
    date.setMonth(date.getMonth() + 1); // Move to the next month
  } else if (type === "prev") {
    date.setMonth(date.getMonth() - 1); // Move to the previous month
  } else {
    throw new Error("Invalid type. Use 'next' or 'prev'.");
  }

  // Set the date to the first day of the month
  date.setDate(1);

  // Format to 'YYYY-MM-DD' and return
  return date.toISOString().split("T")[0];
};
