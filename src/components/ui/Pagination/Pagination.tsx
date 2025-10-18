//================= IMPORTS ===================
import React from 'react';
import styles from './Pagination.module.css';

//================= INTERFACE DE PROPS ===================
interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (pageNumber: number) => void;
}

//================= COMPONENTE PRINCIPAL ===================
export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange
}) => {
    
    //================= CÁLCULOS Y CONSTANTES ===================
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    //================= RENDERIZADO CONDICIONAL TEMPRANO ===================
    if (totalPages <= 1) {
        return null;
    }

    //================= MANEJADOR DE CAMBIO DE PÁGINA ===================
    const handlePageClick = (page: number) => {
        if (page < 1 || page > totalPages) return;
        onPageChange(page);
    };

    //================= LÓGICA DE GENERACIÓN DE NÚMEROS DE PÁGINA ===================
    const getPageNumbers = () => {
        const pageNumbers: (number | string)[] = [];
        const maxPagesToShow = 5;
        const halfPages = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);
            if (currentPage > halfPages + 2) {
                pageNumbers.push('...');
            }

            let start = Math.max(2, currentPage - halfPages);
            let end = Math.min(totalPages - 1, currentPage + halfPages);

            if (currentPage <= halfPages + 1) {
                end = maxPagesToShow;
            }
            if (currentPage >= totalPages - halfPages) {
                start = totalPages - maxPagesToShow + 1;
            }

            for (let i = start; i <= end; i++) {
                pageNumbers.push(i);
            }

            if (currentPage < totalPages - halfPages - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }

        return pageNumbers;
    };

    //================= RENDERIZADO DEL COMPONENTE (JSX) ===================
    return (
        <nav className={styles.pagination}>
            <button
                className={styles.pagination__navButton}
                onClick={() => handlePageClick(currentPage - 1)}
                disabled={currentPage === 1}
            >
                &lt; Anterior
            </button>

            <ul className={styles.pagination__list}>
                {getPageNumbers().map((page, index) => (
                    <li key={index}>
                        {page === '...' ? (
                            <span className={styles.pagination__ellipsis}>...</span>
                        ) : (
                            <button
                                className={`
                                    ${styles.pagination__item} 
                                    ${page === currentPage ? styles['pagination__item--active'] : ''}
                                `}
                                onClick={() => handlePageClick(page as number)}
                            >
                                {page}
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            <button
                className={styles.pagination__navButton}
                onClick={() => handlePageClick(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Siguiente &gt;
            </button>
        </nav>
    );
};