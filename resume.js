(() => {
  const printButton = document.getElementById("printResume");

  printButton?.addEventListener("click", () => {
    window.print();
  });
})();
