document.addEventListener("DOMContentLoaded", () => {
    const pizzaContainer = document.getElementById("pizza-container")
    const pizzaTotalAmount = document.querySelector(".pizza-total-amount")
    const orderItemsList = document.getElementById("order-items-list")
    const orderItemCountSpan = document.getElementById("total-count")
    const orderTotalPriceSpan = document.getElementById("total-sum")
    const clearOrderBtn = document.querySelector(".clear-order-btn")
    const filterButtons = document.querySelectorAll(".filter-btn")

    if (clearOrderBtn) {
        clearOrderBtn.addEventListener("click", clearOrder)
    }

    let cart = []
    let allPizzas = []
    let currentlyDisplayedPizzas = []

    async function loadPizzas() {
        try {
            const response = await fetch("pizzas.json")
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            allPizzas = [...data]
            currentlyDisplayedPizzas = [...allPizzas]

            renderPizzaCards(currentlyDisplayedPizzas)
            updatePizzaCountDisplay(currentlyDisplayedPizzas.length)

        } catch (error) {
            console.error("Could not load pizzas:", error)
        }
    }

    function renderPizzaCards(pizzasToRender) {
        pizzaContainer.innerHTML = ""
        const fragment = document.createDocumentFragment()
        pizzasToRender.forEach(pizza => {
            const pizzaCardElement = createPizzaCard(pizza)
            fragment.appendChild(pizzaCardElement)
        })
        pizzaContainer.appendChild(fragment)
        updatePizzaCountDisplay(pizzasToRender.length)
    }

    function updatePizzaCountDisplay(count) {
        pizzaTotalAmount.innerText = count
    }


    function createPizzaCard(pizza) {
        const card = document.createElement("div")
        card.classList.add("pizza-card")
        card.dataset.pizzaId = pizza.id // for identifying a specific pizza

        if (pizza.label && pizza.label_class) {
            const labelSpan = document.createElement("span")
            labelSpan.classList.add("category-label", pizza.label_class)
            labelSpan.innerText = pizza.label
            card.appendChild(labelSpan)
        }

        const imageWrapper = document.createElement("div")
        imageWrapper.classList.add("pizza-image-wrapper")
        const img = document.createElement("img")
        img.src = pizza.image
        img.alt = pizza.alt_text
        imageWrapper.appendChild(img)
        card.appendChild(imageWrapper)

        const detailsDiv = document.createElement("div")
        detailsDiv.classList.add("pizza-details")

        const title = document.createElement("h2")
        title.classList.add("pizza-title")
        title.innerText = pizza.title
        detailsDiv.appendChild(title)

        const category = document.createElement("p")
        category.classList.add("pizza-category")
        category.innerText = pizza.category
        detailsDiv.appendChild(category)

        const description = document.createElement("p")
        description.classList.add("pizza-description")
        description.innerText = pizza.description
        detailsDiv.appendChild(description)

        const optionsColumns = document.createElement("div")
        optionsColumns.classList.add("pizza-options-columns")

        pizza.sizes.forEach(sizeOption => {
            const optionGroup = document.createElement("div")
            optionGroup.classList.add("pizza-option-group")

            const sizeOptionSpan = document.createElement("span")
            sizeOptionSpan.classList.add("pizza-size-option")

            const sizeTextSpan = document.createElement("span")
            sizeTextSpan.classList.add("size-text")
            const sizeIcon = document.createElement("img")
            sizeIcon.src = "./style/images/size-icon.svg"
            sizeIcon.alt = "Іконка розміру піци"
            sizeTextSpan.appendChild(sizeIcon)
            sizeTextSpan.append(`${sizeOption.size}`)

            const weightTextSpan = document.createElement("span")
            weightTextSpan.classList.add("weight-text")
            const weightIcon = document.createElement("img")
            weightIcon.src = "./style/images/weight.svg"
            weightIcon.alt = "Іконка ваги піци"
            weightTextSpan.appendChild(weightIcon)
            weightTextSpan.append(`${sizeOption.weight}`)

            sizeOptionSpan.appendChild(sizeTextSpan)
            sizeOptionSpan.appendChild(weightTextSpan)
            optionGroup.appendChild(sizeOptionSpan)

            const pricesDiv = document.createElement("div")
            pricesDiv.classList.add("pizza-prices")
            const priceValueSpan = document.createElement("span")
            priceValueSpan.classList.add("pizza-prices-value")
            priceValueSpan.innerText = sizeOption.price
            const currencySpan = document.createElement("span")
            currencySpan.classList.add("currency")
            currencySpan.innerText = "грн."
            pricesDiv.appendChild(priceValueSpan)
            pricesDiv.appendChild(currencySpan)
            optionGroup.appendChild(pricesDiv)

            const buyButton = document.createElement("button")
            buyButton.classList.add("btn-add-to-cart")
            buyButton.innerText = "Купити"
            buyButton.addEventListener("click", () => addToCart(pizza.id, sizeOption))
            optionGroup.appendChild(buyButton)

            optionsColumns.appendChild(optionGroup)
        })

        detailsDiv.appendChild(optionsColumns)
        card.appendChild(detailsDiv)

        return card
    }

    function addToCart(pizzaId, selectedSizeOption) {
        const pizzaData = allPizzas.find(p => p.id === pizzaId)
        if (!pizzaData) {
            console.error("Pizza data not found for ID:", pizzaId)
            return
        }

        const cartItemId = `${pizzaId}_${selectedSizeOption.size}` // generate a unique id for cart items

        const existingItem = cart.find(item => item.cartId === cartItemId)

        if (existingItem) {
            existingItem.quantity++
        } else {
            cart.push({
                cartId: cartItemId,
                id: pizzaId,
                title: pizzaData.title,
                image: pizzaData.image,
                size: selectedSizeOption.size,
                weight: selectedSizeOption.weight,
                price: selectedSizeOption.price,
                quantity: 1
            })
        }
        renderCart()
        saveCartToLocalStorage()
    }

    function renderCart() {
        orderItemsList.innerHTML = ""
        // clear the list to mirror cart array"s current state when called

        if (cart.length === 0) {
            orderItemsList.innerHTML = "<p class='empty-cart-message'>Кошик порожній</p>"
            orderItemCountSpan.innerText = 0
            orderTotalPriceSpan.innerText = "0 грн"
            return
        }

        let totalItems = 0
        let totalPrice = 0

        cart.forEach(item => {
            const orderItemDiv = document.createElement("div")
            orderItemDiv.classList.add("order-item")
            orderItemDiv.dataset.cartId = item.cartId


            const wrapperDiv = document.createElement("div")
            wrapperDiv.classList.add("order-item-wrapper")

            const itemNameP = document.createElement("p")
            itemNameP.innerText = `${item.title} (${item.size === 30 ? "Мала" : "Велика"})`
            const itemNameDiv = document.createElement("div")
            itemNameDiv.classList.add("item-name")
            itemNameDiv.appendChild(itemNameP)
            wrapperDiv.appendChild(itemNameDiv)

            const itemSizeDiv = document.createElement("div")
            itemSizeDiv.classList.add("item-size")
            itemSizeDiv.innerHTML = `
                <span class="size-text">
                    <img src="./style/images/size-icon.svg" alt="Іконка розміру піци"/> ${item.size}
                </span>
                <span class="weight-text">
                    <img src="./style/images/weight.svg" alt="Іконка ваги піци"/> ${item.weight}
                </span>`
            wrapperDiv.appendChild(itemSizeDiv)

            const itemQuantityControlsDiv = document.createElement("div")
            itemQuantityControlsDiv.classList.add("item-quantity-controls")
            const itemPriceP = document.createElement("p")
            itemPriceP.classList.add("item-price")
            itemPriceP.innerText = `${item.price * item.quantity}грн`
            const decreaseBtn = document.createElement("button")
            decreaseBtn.classList.add("quantity-btn", "decrease")
            decreaseBtn.innerText = "–"
            decreaseBtn.addEventListener("click", () => updateQuantity(item.cartId, -1))
            const itemQuantitySpan = document.createElement("span")
            itemQuantitySpan.classList.add("item-quantity")
            itemQuantitySpan.innerText = item.quantity
            const increaseBtn = document.createElement("button")
            increaseBtn.classList.add("quantity-btn", "increase")
            increaseBtn.innerText = "+"
            increaseBtn.addEventListener("click", () => updateQuantity(item.cartId, 1))
            const removeItemBtn = document.createElement("button")
            removeItemBtn.classList.add("remove-item-btn")
            removeItemBtn.innerText = "x"
            removeItemBtn.addEventListener("click", () => removeFromCart(item.cartId))

            itemQuantityControlsDiv.appendChild(itemPriceP)
            itemQuantityControlsDiv.appendChild(decreaseBtn)
            itemQuantityControlsDiv.appendChild(itemQuantitySpan)
            itemQuantityControlsDiv.appendChild(increaseBtn)
            itemQuantityControlsDiv.appendChild(removeItemBtn)
            wrapperDiv.appendChild(itemQuantityControlsDiv)

            orderItemDiv.appendChild(wrapperDiv)

            const miniPizzaImg = document.createElement("img")
            miniPizzaImg.classList.add("mini-pizza-image")
            miniPizzaImg.src = item.image
            miniPizzaImg.alt = item.title
            orderItemDiv.appendChild(miniPizzaImg)

            orderItemsList.appendChild(orderItemDiv)

            totalItems += item.quantity
            totalPrice += item.price * item.quantity
        })

        orderItemCountSpan.innerText = totalItems
        orderTotalPriceSpan.innerText = `${totalPrice} грн`
    }

    function updateQuantity(itemId, quantity) {
        const itemToUpdate = cart.find(item => item.cartId === itemId)
        if (itemToUpdate) {
            itemToUpdate.quantity += quantity
            if (itemToUpdate.quantity <= 0) {
                removeFromCart(itemId)
            } else {
                renderCart()
                saveCartToLocalStorage()
            }
        }
    }

    function removeFromCart(itemId) {
        cart = cart.filter(item => item.cartId !== itemId)
        renderCart()
        saveCartToLocalStorage()
    }

    function clearOrder() {
        if (cart.length === 0) return
        cart = []
        renderCart()
        saveCartToLocalStorage()
    }

    filterButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            filterButtons.forEach(btn => btn.classList.remove("active"))
            event.currentTarget.classList.add("active")
            const filterCategory = event.currentTarget.dataset.filter
            applyFilter(filterCategory)
        })
    })

    function applyFilter(category) {
        if (category === "Усі") {
            currentlyDisplayedPizzas = [...allPizzas]
        }
        else {
            currentlyDisplayedPizzas = allPizzas.filter(pizza => pizza.category === category)
        }
        renderPizzaCards(currentlyDisplayedPizzas)
    }

    function saveCartToLocalStorage() {
        localStorage.setItem("pizzaUserCart", JSON.stringify(cart))
    }

    function loadCartFromLocalStorage() {
        const savedCart = localStorage.getItem("pizzaUserCart");
        if (savedCart) {
            cart = JSON.parse(savedCart)
        } else {
            cart = []
        }
    }

    // initialize
    loadPizzas()
    loadCartFromLocalStorage()
    renderCart()
})



