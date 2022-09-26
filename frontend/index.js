import {
    initializeBlock,
    useBase,
    useRecords,
    expandRecord,
    TextButton,
} from '@airtable/blocks/ui';
import React from 'react';
function TodoApp() {
    const base = useBase();
    const mealIdeas = useRecords(base.getTableByNameIfExists('Meal Ideas'));
    const ingredients = useRecords(base.getTableByNameIfExists('Ingredients'));
    const onHand = "On hand";
    const planned = "Plan";

    const selectedMeals = mealIdeas.filter(mealIdea => mealIdea.getCellValue("Plan") == true);
    const possibleMeals = getPossibleMeals(mealIdeas, ingredients);

    const toggleOnHand = (record) => {
        base.getTableByNameIfExists('Ingredients').updateRecordAsync(
            record, {[onHand]: !record.getCellValue(onHand)}
        );
    };

    const togglePlannedMeal = (record) => {
        base.getTableByNameIfExists('Meal Ideas').updateRecordAsync(
            record, {[planned]: !record.getCellValue(planned)}
        );
    };

    const getCategorizedList = (selectedMeals, ingredients) => {
        const shoppingList = getShoppingList(selectedMeals, ingredients);
        const categorizedList = categorizeShoppingList(shoppingList);
        let itemList = [];
        Object.entries(categorizedList).sort((a,b) => a[0] > b[0]).forEach(([key, value]) => {
            console.log(key);
            console.log(value.map(item => item.name));
            itemList.push( <Category category={key}/> );
            const ingredientsList = value.sort((a,b) => a.name > b.name).map(ingredient => {
                return <Item key={ingredient.id} record={ingredient} onToggle={toggleOnHand} completedFieldId={onHand}/>;
            })
            itemList.push(ingredientsList);
        });
        return itemList;
    };

    const getPlannedMeals = (selectedMeals) => {
        return selectedMeals.map(meal => {
            return <Item key={meal.id} record={meal} onToggle={togglePlannedMeal} completedFieldId={planned}/>;
        })
    }

    return (
        <div>
            <Section title="Planned Meals"/>
            <div>{getPlannedMeals(selectedMeals)}</div>
            <Section title="Shopping List"/>
            <div>{getCategorizedList(selectedMeals, ingredients)}</div>

        </div>
        //
        //
        // <div>
        //     <h2>Meals you can make with what you have on hand</h2>
        //     {getListDisplay(possibleMeals)}
        //     <h2>Meals you can make if you buy one ingredient</h2>
        //     <ul>{getMissingIngredientDisplay(getPossibleMealsWithMissingIngredients(mealIdeas, ingredients))}</ul>
        //     <h2>Meals you've selected to generate your shopping list</h2>
        //     {getListDisplay(selectedMeals.map(meal => meal.name))}
        //     <h2>Shopping list based on meal selection and missing pantry items</h2>
        //     {getNestedListDisplay(getShoppingList(selectedMeals, ingredients))}
        // </div>
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
    const recipeIngredientNames = new Set(selectedMeals.flatMap(record => record.getCellValue("Ingredients")).map(record => record.name));
    const recipeIngredients = ingredients.filter(ingredient => recipeIngredientNames.has(ingredient.name));

    const ingredientsNotOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") !== true);

    const missingPantryItems = ingredients.filter(pantryItem => pantryItem.getCellValue("Refill when empty") == true)
        .filter(pantryItem => pantryItem.getCellValue("On hand") !== true);

    const finalShoppingList = [...new Set(recipeIngredients.filter(item => ingredientsNotOnHand.map(ingredient => ingredient.name).includes(item.name)).concat(missingPantryItems))];
    return finalShoppingList.sort((a,b) => a.name > b.name);
}

function categorizeShoppingList(shoppingList) {
    return shoppingList.reduce((categorizedList, currentValue) => {
        const category = currentValue.getCellValue("Category") == null ? 'Uncategorized ingredient' : currentValue.getCellValue("Category").name;
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

function Section({title}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 20,
                padding: 10,
                fontWeight: 'bold',
                borderTop: '1px solid #ddd',
                borderBottom: '1px solid #ddd',
                backgroundColor: '#FAFAFA',
            }}
        >
            {title}
        </div>
    );
}

function Category({category}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 16,
                padding: 7,
                marginLeft: 5,
                fontWeight: 'bold',
            }}
        >
            {category}
        </div>
    );
}


function Item({record, onToggle, completedFieldId}) {
    const label = record.name || 'Unnamed ingredient';
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: 1,
                marginLeft: 30,
            }}
        >
            <TextButton
                variant="dark"
                size='large'
                onClick={() => {
                    onToggle(record);
                }}
            >
                {label}
            </TextButton>
            <div
                style={{
                    paddingTop: 4,
                    marginLeft: 5,
                }}
            >
            <TextButton
                icon="expand"
                aria-label="Expand record"
                onClick={() => {
                    expandRecord(record);
                }}
            />
            </div>
        </div>

    );

}



// TODO: Organize list by aisle of the grocery store?
// TODO: Add meal ideas from friends
// TODO: Add instructions for meals
// TODO: We're going to need some null safety! null check for no category
// TODO: Add meals where you could make it if you had one more ingredient
