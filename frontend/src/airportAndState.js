export const nigeriaAirportsByState = {
    Abia: ["Umuahia Airstrip"],
    Adamawa: ["Yola Airport"],
    AkwaIbo: ["Victor Attah International Airport", "Eket Airstrip"],
    Anambra: ["Anambra International Cargo and Passenger Airport"],
    Bauchi: ["Sir Abubakar Tafawa Balewa International Airport", "Azare Airstrip"],
    Bayelsa: ["Bayelsa International Airport", "Nembe Airstrip", "Ogbia Airstrip"],
    Benue: ["Makurdi Airport"],
    Borno: ["Maiduguri International Airport"],
    CrossRiver: ["Margaret Ekpo International Airport", "Bebi Airstrip"],
    Delta: ["Asaba International Airport", "Warri Airport", "Escravos Airstrip"],
    Ebonyi: [],
    Edo: ["Benin Airport"],
    Ekiti: ["Ekiti Airport"],
    Enugu: ["Akanu Ibiam International Airport"],
    Gombe: ["Gombe Lawanti International Airport", "Bajoga Airstrip"],
    Imo: ["Sam Mbakwe International Cargo Airport"],
    Jigawa: ["Dutse International Airport"],
    Kaduna: ["Kaduna Airport", "Zaria Airstrip"],
    Kano: ["Mallam Aminu Kano International Airport"],
    Katsina: ["Katsina Airport", "Daura Airstrip"],
    Kebbi: ["Sir Ahmadu Bello International Airport"],
    Kogi: ["Ajaokuta Airstrip"],
    Kwara: ["Ilorin International Airport"],
    Lagos: ["Murtala Muhammed International Airport", "Murtala Muhammed Airport Two (MMA2)"],
    Nasarawa: ["Lafia Airstrip"],
    Niger: ["Minna Airport", "Bida Airstrip"],
    Ogun: ["Gateway Agro-Cargo Airport", "Olusegun Obasanjo Presidential Library Airstrip"],
    Ondo: ["Akure Airport"],
    Osun: ["Osogbo Airstrip"],
    Oyo: ["Ibadan Airport"],
    Plateau: ["Yakubu Gowon Airport"],
    Rivers: ["Port Harcourt International Airport", "Port Harcourt NAF Base"],
    Sokoto: ["Sadiq Abubakar III International Airport"],
    Taraba: ["Jalingo Airport"],
    Yobe: ["Potiskum Airstrip"],
    Zamfara: ["Gusau Airport"],
    FCTAbuja: ["Nnamdi Azikiwe International Airport", "Bwari Airstrip"]
  };
  
  // Example usage: Accessing airports in a specific state
  console.log("Airports in Lagos:", nigeriaAirportsByState["Lagos"]);
  // Output: ["Murtala Muhammed International Airport", "Murtala Muhammed Airport Two (MMA2)"]
  
  // List all states and their airports
  Object.keys(nigeriaAirportsByState).forEach((state) => {
    console.log(`${state}: ${nigeriaAirportsByState[state].length > 0 ? nigeriaAirportsByState[state].join(", ") : "No major operational airport"}`);
  });