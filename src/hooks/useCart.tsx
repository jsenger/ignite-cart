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

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const { data: stockItem }: { data: Stock } = await api.get(
        `stock/${productId}`
      );

      if (cart.some(product => product.id === productId)) {
        setCart(
          cart.map(product => {
            if (product.id === productId) {
              if (stockItem.amount >= product.amount + 1)
                return { ...product, amount: product.amount + 1 };
              else throw new Error('noStock');
            }

            return product;
          })
        );
      } else {
        api.get(`products/${productId}`).then(response => {
          if (stockItem.amount > 0)
            setCart(
              cart.length > 0
                ? [...cart, { ...response.data, amount: 1 }]
                : [{ ...response.data, amount: 1 }]
            );
          else throw new Error('noStock');
        });
      }
    } catch (err) {
      if (err.message === 'noStock')
        toast.error('Quantidade solicitada fora de estoque');

      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter(product => product.id !== productId));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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
