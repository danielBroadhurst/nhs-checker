const axios = require("axios");
const fs = require("fs");

let data = {
  filter:
    "AcceptingPatients/Dentist/any(d: (d/Name eq 'Adults (18 and over)') and (d/AcceptingPatients eq true) or (d/Name eq 'Adults entitled to free dental care') and (d/AcceptingPatients eq true))",
  orderby:
    "geo.distance(Geocode, geography'POINT(-2.631060 53.544270)')",
  select:
    "OrganisationName,Address1,Address2,Address3,Postcode,City,County,AcceptingPatients,LastUpdatedDates,Phone",
  top: 150,
  skip: 0,
  count: true,
};
let request = axios.post(
  "https://api.nhs.uk/service-search/search?api-version=2",
  data,
  {
    headers: {
      "Content-Type": "application/json",
      "subscription-key": "03c38050dc0149bd97ee9f2635334eba",
    },
  }
);

request.then(function (response) {
  const latest25 = response.data.value.map((dentist) => {
    return {
      dentist: dentist.OrganisationName,
      address: `${dentist.Address1}, ${dentist.Address2}`,
      city: dentist.City,
      postCode: dentist.Postcode,
      phone: dentist.Phone,
      lastUpdated: dentist.LastUpdatedDates.DentistsAcceptingPatients,
      accepting: dentist.AcceptingPatients.Dentist.filter(
        (den) => den.AcceptingPatients && (den.Id === 1 || den.Id === 2)
      ),
    };
  });

  try {
    fs.writeFileSync("currentDentistByDistance.json", JSON.stringify(latest25, null, 2));
    latest25.sort(function (a, b) {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    });
    fs.writeFileSync("currentDentistByDate.json", JSON.stringify(latest25, null, 2));
    //file written successfully
  } catch (err) {
    console.error(err);
  }
});
