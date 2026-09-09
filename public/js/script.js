// THIS IS BASICALLY FOR THE FORM VALIDATION JS CODE FROM THE BOOTSRAP :-
// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  var forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.prototype.slice.call(forms)
    .forEach(function (form) {
      form.addEventListener('submit', function (event) {
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }

        form.classList.add('was-validated')
      }, false)
    })
})()

const mapElement = document.querySelector("#map");

if (mapElement) {
  const longitude = Number(mapElement.dataset.longitude);
  const latitude = Number(mapElement.dataset.latitude);

  if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
    const map = L.map(mapElement).setView([latitude, longitude], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const popupContent = document.createElement("div");
    const title = document.createElement("strong");
    const location = document.createElement("p");

    title.textContent = mapElement.dataset.title;
    location.textContent = mapElement.dataset.location;
    popupContent.append(title, location);

    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup(popupContent)
      .openPopup();
  }
}
