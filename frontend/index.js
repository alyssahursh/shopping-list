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
    const packingMeals = mealIdeas.filter(mealIdea => mealIdea.getCellValue("Pack Ingredients for Trip") == true);
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

    const showHide = (name) => {
        var section = document.getElementById(name);
        if (section.style.display === "none") {
            section.style.display = "block";
        } else {
            section.style.display = "none";
        }
    }

    const getCategorizedShoppingList = (selectedMeals, ingredients) => {
        const shoppingList = getShoppingList(selectedMeals, ingredients);
        const categorizedList = categorizeShoppingList(shoppingList);
        let itemList = [];
        Object.entries(categorizedList).sort((a,b) => a[0] > b[0]).forEach(([key, value]) => {
            itemList.push( <Category category={key}/> );
            const ingredientsList = value.sort((a,b) => a.name > b.name).map(ingredient => {
                return <Item key={ingredient.id} record={ingredient} onToggle={toggleOnHand} completedFieldId={onHand}/>;
            })
            itemList.push(<div style={{padding: 6, marginLeft: 4}}>{ingredientsList}</div>);
        });
        return itemList;
    };

    const getCategorizedPackingList = (selectedMeals, ingredients) => {
        const packingList = getPackingList(selectedMeals, ingredients);
        const categorizedList = categorizeShoppingList(packingList);
        let itemList = [];
        Object.entries(categorizedList).sort((a,b) => a[0] > b[0]).forEach(([key, value]) => {
            itemList.push( <Category category={key}/> );
            const ingredientsList = value.sort((a,b) => a.name > b.name).map(ingredient => {
                return <Item key={ingredient.id} record={ingredient} onToggle={() => {}}/>;
            })
            itemList.push(<div style={{padding: 6, marginLeft: 4}}>{ingredientsList}</div>);
        });
        return itemList;
    };


    const getMeals = (selectedMeals) => {
        return selectedMeals.map(meal => {
            return <Item key={meal.id} record={meal} onToggle={togglePlannedMeal} completedFieldId={planned}/>;
        })
    }

    return (
        <div>
            <Section name="make-now" title="Meals You Can Make Now" content={getMeals(possibleMeals)} onToggle={showHide}/>
            <Section name="one-ingredient" title="Meals That Only Need One Ingredient" content={getMeals(getPossibleMealsWithMissingIngredients(mealIdeas, ingredients))} onToggle={showHide}/>
            <Section name="planned-meals" title="Planned Meals" content={getMeals(selectedMeals)} onToggle={showHide}/>
            <Section name="shopping-list" title="Shopping List" content={getCategorizedShoppingList(selectedMeals, ingredients)} onToggle={showHide}/>
            <Section name="packing-list" title="Packing List" content={getCategorizedPackingList(packingMeals, ingredients)} onToggle={showHide}/>
        </div>
    );
}

initializeBlock(() => <TodoApp />);

function getPossibleMeals(mealIdeas, ingredients) {
    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true);
    return mealIdeas.filter(mealIdea => mealIdea.getCellValue("Ingredients")
        .map(ingredient => ingredient.name)
        .every(ingredient => ingredientsOnHand.map(ingredient => ingredient.name).includes(ingredient))).sort((a,b) => a.name > b.name);
}

function getPossibleMealsWithMissingIngredients(mealIdeas, ingredients) {
    const ingredientsOnHand = ingredients.filter(ingredient => ingredient.getCellValue("On hand") == true).map(ingredient => ingredient.name);
    return mealIdeas.reduce((meals, currentMeal) => {
        const missingIngredients = currentMeal.getCellValue("Ingredients")
            .map(ingredient => ingredient.name)
            .filter(ingredientName => !ingredientsOnHand.includes(ingredientName))
        if (missingIngredients.length == 1) {
            meals.push(currentMeal);
        }
        return meals.sort((a,b) => a.name > b.name);
    }, []);
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

function getPackingList(selectedMeals, ingredients) {
    const recipeIngredientNames = new Set(selectedMeals.flatMap(record => record.getCellValue("Ingredients")).map(record => record.name));
    const recipeIngredients = ingredients.filter(ingredient => recipeIngredientNames.has(ingredient.name));
    const extraIngredients = ingredients.filter(ingredient => ingredient.getCellValue("Pack Ingredient for Trip") == true);
    const finalPackingList = [...new Set(recipeIngredients.concat(extraIngredients))];

    return finalPackingList.sort((a,b) => a.name > b.name);
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

function Section({name, title, content, onToggle}) {
    return (
        <div>
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
                onClick={() => {
                    onToggle(name);
                }}
            >
                {title}
            </div>
            <div 
                id={name}
                style={{padding: 18,}}
                >
                {content}
            </div>
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
                padding: 2,
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
                    marginLeft: 6,
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
