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

    const tentativeShoppingList = mealIdeas.filter(record => record.getCellValue("Plan") == true)
        .flatMap(record => record.getCellValue("Ingredients")
        .map(item => item.name))
        .unique();

    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true)
        .map(ingredient => ingredient.name);

    const missingPantryItems = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == null)
        .filter(ingredient => ingredient.getCellValue("Refill when empty") == true)
        .map(ingredient => ingredient.name);
        
    const finalShoppingList = tentativeShoppingList.filter(item => !ingredientsOnHand.includes(item)).concat(missingPantryItems).unique();

    const possibleMeals = mealIdeas.filter(mealIdea => mealIdea.getCellValue("Ingredients").flatMap(ingredient => ingredient.name).every(ingredient => ingredientsOnHand.includes(ingredient))).map(mealIdea => mealIdea.name);

    const list = finalShoppingList.concat(possibleMeals).map(item => {
        return (
            <div key={item.id}>
                {item}
            </div>
        );
    });

    return (
        <div>{list}</div>
    );
}

initializeBlock(() => <TodoApp />);

Array.prototype.unique = function() {
    let arr = [];
    for(let i = 0; i < this.length; i++) {
        if(!arr.includes(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
  }

// TODO: Something else
// TODO: Organize list by category
// TODO: Organize list by aisle of the grocery store?
// TODO: What can you make with what you have on hand?
// TODO: Add meal ideas from friends
// TODO: Add instructions for meals
// TODO: Refill when empty checkmark for ingredients
