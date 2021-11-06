import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stockItem }: { data: Stock } = await api.get(
        `stock/${productId}`
      );

      const { data: product }: { data: Product } = await api.get(
        `products/${productId}`
      );

      const updatedCart = () => {
        if (cart.some(product => product.id === productId)) {
          return cart.map(product => {
            if (product.id === productId) {
              if (stockItem.amount >= product.amount + 1)
                return { ...product, amount: product.amount + 1 };
              else throw new Error('noStock');
            }

            return product;
          });
        } else {
          if (stockItem.amount > 0)
            return cart.length > 0
              ? [...cart, { ...product, amount: 1 }]
              : [{ ...product, amount: 1 }];
          else throw new Error('noStock');
        }
      };

      setCart(updatedCart());
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart()));
    } catch (err) {
      if (err.message === 'noStock')
        toast.error('Quantidade solicitada fora de estoque');
      else toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = cart.filter(product => product.id !== productId);

      if (updatedCart.length !== cart.length) {
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else throw new Error();
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount > 0) {
      try {
        const { data: stockItem }: { data: Stock } = await api.get(
          `stock/${productId}`
        );

        const updatedCart = cart.map(product => {
          if (product.id === productId) {
            if (stockItem.amount >= amount) return { ...product, amount };
            else throw new Error('noStock');
          }

          return product;
        });

        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } catch (err) {
        if (err.message === 'noStock')
          toast.error('Quantidade solicitada fora de estoque');
        else toast.error('Erro na alteração de quantidade do produto');
      }
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
