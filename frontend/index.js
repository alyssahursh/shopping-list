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

    const tentativeShoppingList = [...new Set(mealIdeas.filter(record => record.getCellValue("Plan") == true)
        .flatMap(record => record.getCellValue("Ingredients")
        .map(item => item.name)))]

    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true);

    const missingPantryItems = ingredientsOnHand.filter(ingredient => ingredient.getCellValue("Refill when empty") == true)
        .map(ingredient => ingredient.name);
        
    const finalShoppingList = [...new Set(tentativeShoppingList.filter(item => !ingredientsOnHand.map(ingredient => ingredient.name).includes(item)).concat(missingPantryItems))];

    const categorizedShoppingList = categorizeShoppingList(finalShoppingList, ingredients);

    const possibleMeals = mealIdeas.filter(mealIdea => mealIdea.getCellValue("Ingredients").flatMap(ingredient => ingredient.name).every(ingredient => ingredientsOnHand.map(ingredient => ingredient.name).includes(ingredient))).map(mealIdea => mealIdea.name);

    return (
        <div>
            <h2>Selected Meals</h2>
            <ul>{selectedMeals.map(meal => meal.name).map(meal => {
                    return (
                        <li key={meal.id}>
                            {meal}
                        </li>
                    );
                })}
            </ul>
            <h2>Shopping List</h2>
            <div>{convertCategorizedListToFrontend(categorizedShoppingList)}</div>
        </div>
    );
}

initializeBlock(() => <TodoApp />);

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
                <ul>{categorizedList[category].map(item => {
                    return (
                        <li key={item.id}>
                            {item}
                        </li>
                    );
                })}</ul>
            </div>
        );
    });
}

// TODO: Organize list by category
// TODO: Organize list by aisle of the grocery store?
// TODO: Add meal ideas from friends
// TODO: Add instructions for meals
