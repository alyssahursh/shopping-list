import {
    initializeBlock,
    useBase,
    useRecords,
} from '@airtable/blocks/ui';
import React from 'react';
function TodoApp() {
    const base = useBase();
    const mealIdeas = useRecords(base.getTableByName('Meal Ideas'));
    const ingredients = useRecords(base.getTableByName('Ingredients'));

    const selectedMeals = mealIdeas.filter(mealIdea => mealIdea.getCellValue("Plan") == true);
    const possibleMeals = getPossibleMeals(mealIdeas, ingredients);
    console.log(getPossibleMealsWithMissingIngredients(mealIdeas, ingredients, 2));

    return (
        <div>
            <h2>Meals you can make with what you have on hand</h2>
            {getListDisplay(possibleMeals)}
            <h2>Meals you can make if you buy one ingredient</h2>
            <ul>{getMissingIngredientDisplay(getPossibleMealsWithMissingIngredients(mealIdeas, ingredients))}</ul>
            <h2>Meals you've selected to generate your shopping list</h2>
            {getListDisplay(selectedMeals.map(meal => meal.name))}
            <h2>Shopping list based on meal selection and missing pantry items</h2>
            {getNestedListDisplay(getShoppingList(selectedMeals, ingredients))}
        </div>
    );
}

initializeBlock(() => <TodoApp />);

function getPossibleMeals(mealIdeas, ingredients) {
    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true);
    return mealIdeas.filter(mealIdea => mealIdea.getCellValue("Ingredients")
        .map(ingredient => ingredient.name)
        .every(ingredient => ingredientsOnHand.map(ingredient => ingredient.name).includes(ingredient)))
        .map(mealIdea => mealIdea.name);
}

function getPossibleMealsWithMissingIngredients(mealIdeas, ingredients) {
    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true).map(ingredient => ingredient.name);
    return mealIdeas.reduce((mapOfMealsToMissingIngredients, currentMeal) => {
        const missingIngredients = currentMeal.getCellValue("Ingredients")
            .map(ingredient => ingredient.name)
            .filter(ingredientName => !ingredientsOnHand.includes(ingredientName))
        if (missingIngredients.length == 1) {
            mapOfMealsToMissingIngredients[currentMeal.name] = missingIngredients;
        }
        return mapOfMealsToMissingIngredients;
    }, {});
}

function getShoppingList(selectedMeals, ingredients) {
    const tentativeShoppingList = [...new Set(selectedMeals.flatMap(record => record.getCellValue("Ingredients")
        .map(item => item.name)))]

    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true);

    const missingPantryItems = ingredients.filter(pantryItem => pantryItem.getCellValue("Refill when empty") == true)
        .filter(pantryItem => pantryItem.getCellValue("On hand") !== true)
        .map(pantryItem => pantryItem.name);

    const finalShoppingList = [...new Set(tentativeShoppingList.filter(item => !ingredientsOnHand.map(ingredient => ingredient.name).includes(item)).concat(missingPantryItems))];

    return categorizeShoppingList(finalShoppingList, ingredients);
}

function categorizeShoppingList(shoppingList, ingredients) {
    return shoppingList.reduce((categorizedList, currentValue) => {
        const category = ingredients.find(ingredient => ingredient.name === currentValue).getCellValue("Category").name;
        categorizedList[category] = [
            currentValue, ...(categorizedList[category] || [])
        ];
        return categorizedList;
    }, {})
}

function getMissingIngredientDisplay(recipesWithMissingIngredients) {
    return Object.keys(recipesWithMissingIngredients).map(recipe => {
        return (
            <li><b>{recipe}:</b> {recipesWithMissingIngredients[recipe]}</li>
        );
    });
}

function getNestedListDisplay(categorizedList) {
    return Object.keys(categorizedList).map(category => {
        return (
            <div key={category.id}>
                <h3>{category}</h3>
                {getListDisplay(categorizedList[category])}
            </div>
        );
    });
}

function getListDisplay(list) {
    return <ul>{list.map(item => {
        return (
            <li key={item.id}>
                {item}
            </li>
        );
    })}</ul>
}

// TODO: Organize list by aisle of the grocery store?
// TODO: Add meal ideas from friends
// TODO: Add instructions for meals
// TODO: We're going to need some null safety! null check for no category
// TODO: Add meals where you could make it if you had one more ingredient
