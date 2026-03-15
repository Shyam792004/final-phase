    // import { useState } from "react";
    // import TravelStatusOverview from "./TravelStatusOverview";
    // import { travelData } from "../data/travelData";

    // export default function TravelStatusWrapper() {
    // const locations = Object.keys(travelData);
    // const [selectedLocation, setSelectedLocation] = useState(locations[0]);

    // const handleLocationChange = (e) => {
    //     setSelectedLocation(e.target.value);
    // };

    // return (
    //     <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
        
    //     {/* Header + Location Dropdown */}
    //     <div className="flex items-center justify-between">
    //         <h2 className="text-2xl font-bold text-white">Travel Status Dashboard</h2>
    //         <select
    //         value={selectedLocation}
    //         onChange={handleLocationChange}
    //         className="bg-slate-700 text-white p-2 rounded-md shadow-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    //         >
    //         {locations.map((loc) => (
    //             <option key={loc} value={loc}>{loc}</option>
    //         ))}
    //         </select>
    //     </div>

    //     {/* Dynamic Travel Status */}
    //     <TravelStatusOverview travelStatus={travelData[selectedLocation]} />

    //     </div>
    // );
    // }
