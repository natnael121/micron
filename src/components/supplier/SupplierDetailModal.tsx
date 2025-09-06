@@ .. @@
   useEffect(() => {
     const loadProducts = async () => {
       setLoadingProducts(true);
       try {
         console.log('Loading products for supplier:', supplier.id);
        // Use supplier service to get all products
        const { supplierService } = await import('../../services/supplierService');
        const productsData = await supplierService.getAllSupplierProducts(supplier.id);
+        const productsData = await firebaseService.getAllSupplierProducts(supplier.id);
         console.log('Products loaded for supplier detail:', productsData.length);
         setProducts(productsData);
       } catch (error) {
         console.error('Error loading products:', error);
-        // Try direct Firebase query as fallback
-        try {
-          const { firebaseService } = await import('../../services/firebase');
-          const fallbackProducts = await firebaseService.getAllSupplierProducts(supplier.id);
-          console.log('Fallback products loaded:', fallbackProducts.length);
-          setProducts(fallbackProducts);
-        } catch (fallbackError) {
-          console.error('Fallback failed:', fallbackError);
-          setProducts([]);
        // Use supplier service for orders
        const { supplierService } = await import('../../services/supplierService');
        const ordersData = await supplierService.getSupplierOrders(supplier.id);
       } finally {
         setLoadingProducts(false);
       }
     };

     const loadOrders = async () => {
       setLoadingOrders(true);
       try {
-        const ordersData = await supplierService.getSupplierOrders(supplier.id);
+        // Use Firebase service directly for orders
+        const ordersData = await firebaseService.getSupplierOrders(supplier.id);
         setRecentOrders(ordersData.slice(0, 5));
       } catch (error) {
         console.error('Error loading orders:', error);
         setRecentOrders([]);
       } finally {
         setLoadingOrders(false);
       }
     };

     loadProducts();
     loadOrders();
   }, [supplier.id]);