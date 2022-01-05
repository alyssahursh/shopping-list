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

    return (
        <div>
            <h2>Meals you can make with what you have on hand</h2>
            {getListDisplay(possibleMeals)}
            <h2>Selected Meals</h2>
            {getListDisplay(selectedMeals.map(meal => meal.name))}
            <h2>Shopping List</h2>
            {convertCategorizedListToFrontend(getShoppingList(selectedMeals, ingredients))}
        </div>
    );
}

initializeBlock(() => <TodoApp />);

function getPossibleMeals(mealIdeas, ingredients) {
    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true);
    return mealIdeas.filter(mealIdea => mealIdea.getCellValue("Ingredients")
        .flatMap(ingredient => ingredient.name)
        .every(ingredient => ingredientsOnHand.map(ingredient => ingredient.name)
        .includes(ingredient)))
        .map(mealIdea => mealIdea.name);

}

function getShoppingList(selectedMeals, ingredients) {
    const tentativeShoppingList = [...new Set(selectedMeals.flatMap(record => record.getCellValue("Ingredients")
        .map(item => item.name)))]

    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true);

    const missingPantryItems = ingredientsOnHand.filter(ingredient => ingredient.getCellValue("Refill when empty") == true)
        .map(ingredient => ingredient.name);

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

function convertCategorizedListToFrontend(categorizedList) {
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

// TODO: Organize list by category
// TODO: Organize list by aisle of the grocery store?
// TODO: Add meal ideas from friends
// TODO: Add instructions for meals
