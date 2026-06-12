export function getFallbackTransportOptions(
  startLocation: string,
  destination: string,
  budget: number,
  days: number
) {
  const routeSeed = startLocation.length + destination.length + days;
  const trainBase = Math.max(350, Math.floor(budget * 0.08));
  const busBase = Math.max(250, Math.floor(budget * 0.055));
  const trainDuration = 5 + (routeSeed % 10);
  const busDuration = trainDuration + 2 + (routeSeed % 4);
  const returnTrainDuration = trainDuration + (routeSeed % 3) - 1;
  const returnTrainBase = trainBase + 80;

  return {
    trains: [
      {
        rank: 1,
        name: `${destination} Superfast Express`,
        type: "Fastest balanced option",
        duration: `${trainDuration}h ${routeSeed % 6}0m`,
        fare: trainBase,
        comfort: "AC Chair / 3A",
        note: "Best mix of speed, comfort, and fare for this route.",
      },
      {
        rank: 2,
        name: `${destination} Intercity Express`,
        type: "Budget friendly",
        duration: `${trainDuration + 1}h ${(routeSeed + 2) % 6}0m`,
        fare: Math.max(250, trainBase - 180),
        comfort: "Sleeper / 2S",
        note: "Lower fare option if you are flexible on comfort.",
      },
      {
        rank: 3,
        name: `${destination} Premium Special`,
        type: "Most comfortable",
        duration: `${Math.max(4, trainDuration - 1)}h ${(routeSeed + 4) % 6}0m`,
        fare: trainBase + 420,
        comfort: "2A / 3A",
        note: "Recommended when comfort matters more than the lowest price.",
      },
    ],
    returnTrains: [
      {
        rank: 1,
        name: `${startLocation} Return Superfast`,
        type: "Best return pick",
        duration: `${returnTrainDuration}h ${(routeSeed + 1) % 6}0m`,
        fare: returnTrainBase,
        comfort: "AC Chair / 3A",
        note: `Best train option for returning from ${destination} to ${startLocation}.`,
      },
      {
        rank: 2,
        name: `${startLocation} Night Express`,
        type: "Overnight return",
        duration: `${returnTrainDuration + 2}h ${(routeSeed + 3) % 6}0m`,
        fare: Math.max(280, returnTrainBase - 140),
        comfort: "Sleeper / 3A",
        note: "Useful if you want to travel back overnight and save daytime hours.",
      },
      {
        rank: 3,
        name: `${startLocation} Premium Return Special`,
        type: "Comfort return",
        duration: `${Math.max(4, returnTrainDuration - 1)}h ${(routeSeed + 5) % 6}0m`,
        fare: returnTrainBase + 460,
        comfort: "2A / 3A",
        note: "Recommended for a smoother return journey after a packed trip.",
      },
    ],
    buses: [
      {
        rank: 1,
        name: "Volvo AC Sleeper",
        type: "Overnight comfort",
        duration: `${busDuration}h ${(routeSeed + 1) % 6}0m`,
        fare: busBase + 220,
        comfort: "AC Sleeper",
        note: "Best for saving a hotel night on longer routes.",
      },
      {
        rank: 2,
        name: "AC Seater / Semi-Sleeper",
        type: "Value pick",
        duration: `${busDuration + 1}h ${(routeSeed + 3) % 6}0m`,
        fare: busBase,
        comfort: "AC Seater",
        note: "Good balance for daytime travel and shorter budgets.",
      },
      {
        rank: 3,
        name: "Non-AC Sleeper",
        type: "Lowest fare",
        duration: `${busDuration + 2}h ${(routeSeed + 5) % 6}0m`,
        fare: Math.max(180, busBase - 160),
        comfort: "Sleeper",
        note: "Cheapest option when comfort is less important.",
      },
    ],
  };
}
