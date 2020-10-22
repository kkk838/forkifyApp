import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import { elements, renderLoader, clearLoader} from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';



/* *- Global state of the app
* - Search object
* - Current recipe object
* -  Shopping list object
*- Liked recipe
*/
/////////////// Search Controller ////////////
const state = {};

const controlSearch = async () => {
    // 1. get query from view
    const query = searchView.getInput();
   

    if(query){
        // 2. New search object and add to state

        state.search = new Search(query);

        // 3. Prepare UI for result
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
            // 4. Search for recipes
            await state.search.getResult();

            // 5. Render result on UI
            clearLoader();
            searchView.renderResults(state.search.result);
            //console.log(state.search.result);
        }catch(error){
            alert('Something wrong with search');
            clearLoader();
        }
        
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e =>{
    const btn = e.target.closest('.btn-inline');
    if(btn)
    {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
       // console.log(goToPage);
    }
});



 /////////////////// LIST CONTROLLER ////////////////////////////////
 
const controlList = () => {
    // Create a new list IF there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        console.log(item);
        listView.renderItem(item);
    });
}
// Handle delete and update list item events

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if(e.target.matches('.shopping__delete, .shopping__delete *'))
    {
        state.list.deleteItem(id);

        listView.deleteItem(id);
    }else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }


});

////////////////// LIKES CONTROLLER ///////////////////

//Testing
state.likes = new Likes();

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has not yet liked current recipe
    if(!state.likes.isLiked(currentID))
    {
        //Add like to the state
        const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);

        // Toggle the like button
        likesView.toggleLikeBtn(true);
        // Add like to UI
        likesView.renderLike(newLike);
        
    }else {
        //remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);
        // Remove like from UI list
        likesView.deleteLike(currentID);
        //console.log(state.likes);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());

}

// Restore liked recipe on page load
window.addEventListener('load',  () => {
    state.likes = new Likes();
    // restore like
    state.likes.readStorage();
    // toglle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})

////////////// Recipe Controller /////////////////////////


const controlrecipe = async () => {
    const id = window.location.hash.replace('#', '');
    console.log(id);

    if(id) {
        // Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        //create new recipe object
        state.recipe = new Recipe(id);

        try{
            // get recipe data and parse ingredient
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            // calculate serving and time
            state.recipe.calcTime();
            state.recipe.calcServing();

            // Render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        }catch(error){
            console.log(error);
        }
        
    }
}

//window.addEventListener('hashchange', controlrecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlrecipe));

// Handling recipe button clicks

elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *'))
    {
        //decrease button is clicked
        if(state.recipe.servings > 1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }
    else if(e.target.matches('.btn-increase, .btn-increase *'))
    {
        //Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    }else if(e.target.matches('.recipe__love, .recipe__love *')){
        console.log('love');
        controlLike();
    }
    //console.log(state.recipe);
});