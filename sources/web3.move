module web3::web3 {
    use std::string::String;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    // --- Errors ---
    const ENotAdmin: u64 = 0;
    const EInsufficientBalance: u64 = 1;

    /// The library store that holds the funds and configuration.
    /// This is a shared object.
    public struct Library has key {
        id: UID,
        sui_balance: Balance<SUI>,
        admin: address,
    }

    /// The Access Ticket object representing ownership or access right to a book.
    /// This is given to the user after a successful purchase.
    public struct AccessTicket has key, store {
        id: UID,
        book_id: String,
    }

    /// Event emitted when a ticket is purchased.
    /// Useful for off-chain indexing and verification.
    public struct TicketPurchased has copy, drop {
        ticket_id: ID,
        book_id: String,
        buyer: address,
    }

    /// Initializes the library as a shared object.
    fun init(ctx: &mut TxContext) {
        transfer::share_object(Library {
            id: object::new(ctx),
            sui_balance: balance::zero(),
            admin: tx_context::sender(ctx),
        });
    }

    /// Buy an access ticket using SUI.
    /// The paid SUI is added to the library's shared balance.
    public fun buy_ticket(
        library: &mut Library,
        payment: Coin<SUI>,
        book_id: String,
        ctx: &mut TxContext
    ): AccessTicket {
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut library.sui_balance, coin_balance);

        let ticket = AccessTicket {
            id: object::new(ctx),
            book_id,
        };

        event::emit(TicketPurchased {
            ticket_id: object::id(&ticket),
            book_id,
            buyer: tx_context::sender(ctx),
        });

        ticket
    }

    /// Admin function to withdraw SUI from the library's balance.
    public fun withdraw_sui(
        library: &mut Library,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == library.admin, ENotAdmin);
        assert!(balance::value(&library.sui_balance) >= amount, EInsufficientBalance);
        
        let coin = coin::take(&mut library.sui_balance, amount, ctx);
        transfer::public_transfer(coin, library.admin);
    }

    /// Admin function to change the admin address.
    public fun change_admin(
        library: &mut Library,
        new_admin: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == library.admin, ENotAdmin);
        library.admin = new_admin;
    }
}
