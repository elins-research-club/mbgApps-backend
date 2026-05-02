function calculateTotalIngridients(plateRecipes, totalPortion) {
  totalIngredients = {};
  plateRecipes.forEach((item) => {
    item.rincian_bahan.forEach((bahan) => {
      totalIngredients[bahan.nama] =
        (totalIngredients[bahan.nama] || 0) + bahan.gramasi * item.quantity;
    });
  });

  Object.keys(totalIngredients).forEach((nama) => {
    totalIngredients[nama] = totalIngredients[nama] * totalPortion;
  });
  return totalIngredients;
}

module.exports = {
  calculateTotalIngridients,
};
